import { visit } from 'unist-util-visit'
import type { Root, RootContent, Code } from 'mdast'
import { toString } from 'mdast-util-to-string'
import type { RendererDefinition } from './types'
import type { SchemaPart } from './schema'
import { matchesSchema } from './parseSchema'
import { parseMarkdown, serializeMarkdown } from './parseMarkdown'

export interface RenderedBlock {
  renderer: RendererDefinition | null
  markdown: string
}

function htmlValue(node: RootContent): string | null {
  return node.type === 'html' ? node.value.trim() : null
}

/** スキーマの特異性スコア — 制約が多いほど高い */
function specificity(schema: Record<string, SchemaPart>): number {
  let score = 0
  for (const part of Object.values(schema)) {
    score += 1 // each field adds base specificity
    if (part.kind === 'heading') {
      if ('contentMatch' in part && part.contentMatch) score += 2
      if ('level' in part && part.level != null) score += 1
    }
    if (part.kind === 'codeblock' && 'lang' in part && part.lang) score += 1
    if (part.kind === 'text' && 'filter' in part && part.filter) score += 1
    if (part.kind === 'list') {
      if ('allConstraint' in part) score += 2
      if ('allFormatConstraint' in part) score += 2
      if ('someConstraint' in part) score += 1
      if ('minCount' in part && part.minCount) score += 1
      if ('someChecks' in part && part.someChecks) score += part.someChecks.length
    }
  }
  return score
}

/** トップレベルノードをレンダラー単位にグループ化する */
function groupNodes(nodes: RootContent[]): RootContent[][] {
  const groups: RootContent[][] = []
  let current: RootContent[] = []
  let inCompare = false

  for (const node of nodes) {
    const html = htmlValue(node)

    // <!-- before --> で compare ブロック開始
    if (html === '<!-- before -->') {
      if (current.length) { groups.push(current); current = [] }
      inCompare = true
      current.push(node)
      continue
    }

    // <!-- end --> で compare ブロック終了
    if (html === '<!-- end -->' && inCompare) {
      current.push(node)
      groups.push(current)
      current = []
      inCompare = false
      continue
    }

    if (inCompare) {
      // compare ブロック内はすべて同じグループに入れる
      current.push(node)
    } else if (node.type === 'code' || node.type === 'blockquote' || node.type === 'table') {
      // コードブロック・blockquote・table は単独グループ
      if (current.length) { groups.push(current); current = [] }
      groups.push([node])
    } else if (node.type === 'list') {
      // リストは直前もリストなら同じグループに続ける（pros-cons等の複数リスト対応）
      const lastGroup = groups[groups.length - 1]
      if (current.length === 0 && lastGroup && lastGroup.every(node => node.type === 'list')) {
        lastGroup.push(node)
      } else {
        if (current.length) { groups.push(current); current = [] }
        groups.push([node])
      }
    } else {
      current.push(node)
    }
  }
  if (current.length) groups.push(current)
  return groups
}

/** ノード群から参照されている footnoteReference の識別子を収集する */
function collectFootnoteRefs(nodes: RootContent[]): string[] {
  const ids: string[] = []
  const root: Root = { type: 'root', children: nodes }
  visit(root, 'footnoteReference', (node) => { ids.push(node.identifier) })
  return ids
}

/** ノード群から参照されている linkReference / imageReference の識別子を収集する */
function collectLinkRefs(nodes: RootContent[]): string[] {
  const ids: string[] = []
  const root: Root = { type: 'root', children: nodes }
  visit(root, 'linkReference', (node) => { ids.push(node.identifier) })
  visit(root, 'imageReference', (node) => { ids.push(node.identifier) })
  return ids
}

/** ノード群に対応する元のMarkdown文字列をオフセットで抽出する */
function extractRaw(source: string, nodes: RootContent[]): string {
  const first = nodes[0]
  const last = nodes[nodes.length - 1]
  const start = first.position?.start.offset ?? 0
  const end = last.position?.end.offset ?? source.length
  return source.slice(start, end).trim()
}

function nodesToMarkdown(nodes: RootContent[]): string {
  return serializeMarkdown({ type: 'root', children: nodes })
}

/** 隣接するデフォルトブロックをまとめる */
function mergeDefaultBlocks(blocks: RenderedBlock[]): RenderedBlock[] {
  const merged: RenderedBlock[] = []
  for (const block of blocks) {
    const prev = merged[merged.length - 1]
    if (!block.renderer && prev && !prev.renderer) {
      prev.markdown += '\n\n' + block.markdown
    } else {
      merged.push({ ...block })
    }
  }
  return merged
}

/** Check if a heading text matches any renderer by name or contentMatch */
function findRendererByHeading(text: string, renderers: RendererDefinition[]): RendererDefinition | undefined {
  return renderers.find(r => {
    if (r.name.toLowerCase() === text.toLowerCase()) return true
    for (const part of Object.values(r.schema)) {
      if (part.kind === 'heading' && part.contentMatch) {
        const match = part.contentMatch
        if (typeof match === 'string' ? text.toLowerCase() === match.toLowerCase() : match.test(text)) return true
      }
    }
    return false
  })
}

export function route(markdown: string, renderers: RendererDefinition[]): RenderedBlock[] {
  const ast = parseMarkdown(markdown)

  const footnoteDefs = ast.children.filter(node => node.type === 'footnoteDefinition')
  const linkDefs = ast.children.filter(node => node.type === 'definition')
  const contentNodes = ast.children.filter(
    node => node.type !== 'footnoteDefinition' && node.type !== 'definition'
  )

  // ── Pass 1: 名前付き見出しで区間分割 ──
  // heading のテキストがレンダラー名 or contentMatch にマッチしたら、
  // そこから次の名前付き見出し(or末尾)までを1ブロックとして切り出す
  type Segment = { named: RendererDefinition; nodes: RootContent[] } | { named: null; nodes: RootContent[] }
  const segments: Segment[] = []
  let currentSegment: Segment = { named: null, nodes: [] }

  for (const node of contentNodes) {
    if (node.type === 'heading') {
      const text = toString(node).trim()
      const matched = findRendererByHeading(text, renderers)
      if (matched) {
        // 現在のセグメントを確定
        if (currentSegment.nodes.length > 0) segments.push(currentSegment)
        // 新しい名前付きセグメント開始
        currentSegment = { named: matched, nodes: [node] }
        continue
      }
    }
    currentSegment.nodes.push(node)
  }
  if (currentSegment.nodes.length > 0) segments.push(currentSegment)

  // ── Pass 2: 各セグメントをルーティング ──
  function resolveNodes(nodes: RootContent[]): { renderer: RendererDefinition | null; markdown: string } {
    const rawMd = extractRaw(markdown, nodes)
    const referencedFootnotes = collectFootnoteRefs(nodes)
    const referencedLinks = collectLinkRefs(nodes)
    const attachedDefs: RootContent[] = [
      ...footnoteDefs.filter(d => referencedFootnotes.includes((d as { identifier: string }).identifier)),
      ...linkDefs.filter(d => referencedLinks.includes((d as { identifier: string }).identifier)),
    ]
    const md = attachedDefs.length > 0
      ? nodesToMarkdown([...nodes, ...attachedDefs])
      : (rawMd || nodesToMarkdown(nodes))
    const matches = renderers.filter((r) => matchesSchema(md, r.schema))
    const renderer = matches.length > 1
      ? matches.reduce((best, r) => specificity(r.schema) > specificity(best.schema) ? r : best)
      : (matches[0] ?? null)
    return { renderer, markdown: md }
  }

  const routed: RenderedBlock[] = []

  for (const seg of segments) {
    if (seg.named) {
      // 名前付きセグメント: 最小マッチを探す（余分な散文を含めない）
      let matchEnd = seg.nodes.length
      for (let end = seg.nodes.length; end >= 1; end--) {
        const md = nodesToMarkdown(seg.nodes.slice(0, end))
        if (matchesSchema(md, seg.named.schema)) {
          matchEnd = end
        }
      }

      const matchedMd = nodesToMarkdown(seg.nodes.slice(0, matchEnd))
      if (matchesSchema(matchedMd, seg.named.schema)) {
        routed.push({ renderer: seg.named, markdown: matchedMd })
      } else {
        routed.push({ renderer: null, markdown: matchedMd })
      }

      // 余りのノードは散文として出力
      if (matchEnd < seg.nodes.length) {
        const remainingMd = nodesToMarkdown(seg.nodes.slice(matchEnd))
        routed.push({ renderer: null, markdown: remainingMd })
      }
    } else {
      // 名前なしセグメント: 従来のグループ分割 + スキーママッチ
      const groups = groupNodes(seg.nodes)
      for (let i = 0; i < groups.length; i++) {
        // Named code block
        if (groups[i].length === 1 && groups[i][0].type === 'code' && (groups[i][0] as Code).lang) {
          const codeNode = groups[i][0] as Code
          const namedRenderer = renderers.find(r => r.name === codeNode.lang)
          if (namedRenderer) {
            const lines = codeNode.value.trim().split('\n')
            const asList = lines.map(l => `- ${l}`).join('\n')
            if (matchesSchema(asList, namedRenderer.schema)) {
              routed.push({ renderer: namedRenderer, markdown: asList })
              continue
            }
            if (matchesSchema(codeNode.value, namedRenderer.schema)) {
              routed.push({ renderer: namedRenderer, markdown: codeNode.value })
              continue
            }
          }
        }

        const result = resolveNodes(groups[i])

        // merge-forward: パラグラフを含まないグループのみ
        if (!result.renderer && i + 1 < groups.length) {
          const hasParagraph = groups[i].some(node => node.type === 'paragraph')
          if (!hasParagraph) {
            const merged = [...groups[i], ...groups[i + 1]]
            const mergedResult = resolveNodes(merged)
            if (mergedResult.renderer) {
              routed.push(mergedResult)
              i++
              continue
            }
          }
        }

        routed.push(result)
      }
    }
  }

  return mergeDefaultBlocks(routed)
}
