// url=https://www.figma.com/design/NfVqQsRMtl7izgDxYm3BG9/Vision360-Web-Application?node-id=350-11188
// source=src/app/components/ui/table.tsx
// component=TableCell
// NOTE: Replace node-id above with the main "Table Cell" component's node ID (not an instance).
import figma from 'figma'
const instance = figma.selectedInstance

// Text content lives in the "Table cell" text layer inside the Figma component
const cellLayer = instance.findText('Table cell')
const cell =
  cellLayer && cellLayer.type === 'TEXT' ? cellLayer.textContent : ''

export default {
  example: figma.code`<TableCell>${cell}</TableCell>`,
  imports: ['import { TableCell } from "@/app/components/ui/table"'],
  id: 'table-cell',
  metadata: { nestable: true },
}
