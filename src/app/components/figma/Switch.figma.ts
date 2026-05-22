// url=https://www.figma.com/design/NfVqQsRMtl7izgDxYm3BG9/Vision360-Web-Application?node-id=24-1180
// source=src/app/components/ui/switch.tsx
// component=Switch
import figma from 'figma'
const instance = figma.selectedInstance

// Figma uses "True"/"False" string variant for checked state
const checked = instance.getEnum('checked', {
  'True': true,
  'False': false,
})

const disabled = instance.getEnum('state', {
  'Default': false,
  'Disabled': true,
})

export default {
  example: figma.code`
    <Switch
      ${checked ? 'defaultChecked' : ''}
      ${disabled ? 'disabled' : ''}
    />
  `,
  imports: ['import { Switch } from "@/app/components/ui/switch"'],
  id: 'switch',
  metadata: { nestable: true },
}
