// url=https://www.figma.com/design/NfVqQsRMtl7izgDxYm3BG9/Vision360-Web-Application?node-id=350-11173
// source=src/app/components/ui/input.tsx
// component=Input
// NOTE: Replace node-id above with the main Input component's node ID (not an instance).
import figma from 'figma'
const instance = figma.selectedInstance

const placeholder = instance.getString('Value')

const type = instance.getEnum('Type', {
  'Text': 'text',
  'Email': 'email',
  'Password': 'password',
  'Number': 'number',
  'Search': 'search',
  'Tel': 'tel',
})

const disabled = instance.getBoolean('Disabled')

export default {
  example: figma.code`
    <Input
      type="${type}"
      placeholder="${placeholder}"
      ${disabled ? 'disabled' : ''}
    />
  `,
  imports: ['import { Input } from "@/app/components/ui/input"'],
  id: 'input',
  metadata: { nestable: true },
}
