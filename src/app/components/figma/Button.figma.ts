// url=https://www.figma.com/design/NfVqQsRMtl7izgDxYm3BG9/Vision360-Web-Application?node-id=350-11168
// source=src/app/components/ui/button.tsx
// component=Button
// NOTE: Replace node-id above with the main Button component's node ID (not an instance).
//       Right-click the Button component in Figma's Assets panel → Copy link → paste the node-id here.
import figma from 'figma'
const instance = figma.selectedInstance

const label = instance.getString('Label')

const variant = instance.getEnum('Variant', {
  'Default': 'default',
  'Primary': 'default',
  'Destructive': 'destructive',
  'Outline': 'outline',
  'Secondary': 'secondary',
  'Ghost': 'ghost',
  'Link': 'link',
})

const size = instance.getEnum('Size', {
  'Default': 'default',
  'SM': 'sm',
  'Small': 'sm',
  'LG': 'lg',
  'Large': 'lg',
  'Icon': 'icon',
})

const disabled = instance.getBoolean('Disabled')

export default {
  example: figma.code`
    <Button
      variant="${variant}"
      size="${size}"
      ${disabled ? 'disabled' : ''}
    >
      ${label}
    </Button>
  `,
  imports: ['import { Button } from "@/app/components/ui/button"'],
  id: 'button',
  metadata: { nestable: true },
}
