// url=https://www.figma.com/design/NfVqQsRMtl7izgDxYm3BG9/Vision360-Web-Application?node-id=350-11177
// source=src/app/components/ui/table.tsx
// component=TableHead
// NOTE: Replace node-id above with the main "Table Header" component's node ID (not an instance).
import figma from 'figma'
const instance = figma.selectedInstance

// Text content lives in the "Table heading" text layer inside the Figma component
const headingLayer = instance.findText('Table heading')
const heading =
  headingLayer && headingLayer.type === 'TEXT' ? headingLayer.textContent : ''

export default {
  example: figma.code`<TableHead>${heading}</TableHead>`,
  imports: ['import { TableHead } from "@/app/components/ui/table"'],
  id: 'table-head',
  metadata: { nestable: true },
}
