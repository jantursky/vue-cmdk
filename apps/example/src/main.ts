import { createApp } from 'vue'
import { createCommandRegistry } from 'vue-cmdk-palette'
import 'vue-cmdk-palette/style.css'

import App from './App.vue'
import './styles.css'

createApp(App).use(createCommandRegistry()).mount('#app')
