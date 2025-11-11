import { createRouter, createWebHistory } from 'vue-router'
import ModelerView from '@/views/ModelerView.vue'
import SimpleBpmnTest from '@/components/bpmn/SimpleBpmnTest.vue'
import SimpleBpmnModeler from '@/components/bpmn/SimpleBpmnModeler.vue'
import NodeShowcase from '@/components/bpmn/NodeShowcase.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'modeler',
      component: SimpleBpmnModeler
    },
    {
      path: '/test',
      name: 'test',
      component: SimpleBpmnTest
    },
    {
      path: '/simple',
      name: 'simple',
      component: SimpleBpmnModeler
    },
    {
      path: '/showcase',
      name: 'showcase', 
      component: NodeShowcase
    }
  ]
})

export default router