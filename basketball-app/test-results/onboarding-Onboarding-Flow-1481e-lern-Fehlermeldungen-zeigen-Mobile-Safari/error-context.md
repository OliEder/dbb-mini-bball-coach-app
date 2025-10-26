# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]: "[plugin:vite:import-analysis] Failed to resolve import \"../onboarding-v2.store\" from \"src/domains/onboarding/components/v2/CompletionStep.tsx\". Does the file exist?"
  - generic [ref=e5]: /Users/oliver-marcuseder/Documents/00-Privat/Basketball-Apps/basketball-app/src/domains/onboarding/components/v2/CompletionStep.tsx:10:37
  - generic [ref=e6]: "8 | import { useNavigate } from 'react-router-dom'; 9 | import { Check } from 'lucide-react'; 10 | import { useOnboardingV2Store } from '../onboarding-v2.store'; | ^ 11 | import { useAppStore } from '@/stores/appStore'; 12 | export const CompletionStep = ()=>{"
  - generic [ref=e7]: at TransformPluginContext._formatLog (file:///Users/oliver-marcuseder/Documents/00-Privat/Basketball-Apps/basketball-app/node_modules/vite/dist/node/chunks/config.js:31120:43) at TransformPluginContext.error (file:///Users/oliver-marcuseder/Documents/00-Privat/Basketball-Apps/basketball-app/node_modules/vite/dist/node/chunks/config.js:31117:14) at normalizeUrl (file:///Users/oliver-marcuseder/Documents/00-Privat/Basketball-Apps/basketball-app/node_modules/vite/dist/node/chunks/config.js:29604:18) at async file:///Users/oliver-marcuseder/Documents/00-Privat/Basketball-Apps/basketball-app/node_modules/vite/dist/node/chunks/config.js:29662:32 at async Promise.all (index 4) at async TransformPluginContext.transform (file:///Users/oliver-marcuseder/Documents/00-Privat/Basketball-Apps/basketball-app/node_modules/vite/dist/node/chunks/config.js:29630:4) at async EnvironmentPluginContainer.transform (file:///Users/oliver-marcuseder/Documents/00-Privat/Basketball-Apps/basketball-app/node_modules/vite/dist/node/chunks/config.js:30919:14) at async loadAndTransform (file:///Users/oliver-marcuseder/Documents/00-Privat/Basketball-Apps/basketball-app/node_modules/vite/dist/node/chunks/config.js:26057:26) at async viteTransformMiddleware (file:///Users/oliver-marcuseder/Documents/00-Privat/Basketball-Apps/basketball-app/node_modules/vite/dist/node/chunks/config.js:27132:20)
  - generic [ref=e8]:
    - text: Click outside, press Esc key, or fix the code to dismiss.
    - text: You can also disable this overlay by setting
    - code [ref=e9]: server.hmr.overlay
    - text: to
    - code [ref=e10]: "false"
    - text: in
    - code [ref=e11]: vite.config.js
    - text: .
```