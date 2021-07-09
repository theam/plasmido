import {RouteRecordRaw} from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: 'clusters', component: () => import('pages/ClusterPage.vue'),
        children: [
          {path: 'new', component: () => import('components/cluster/EmptyClusterForm.vue'), name: 'empty_broker_path'},
          {path: ':id?', component: () => import('components/cluster/ClusterForm.vue'), name: 'broker_path'}
        ]
      },
      {
        path: 'registries', component: () => import('pages/SchemaRegistryPage.vue'),
        children: [
          {path: 'new', component: () => import('components/schemas/EmptySchemaRegistryForm.vue'), name: 'empty_registry_path'},
          {path: ':id?', component: () => import('components/schemas/SchemaRegistryForm.vue'), name: 'registry_path'}
        ]
      },
      {
        path: 'environments', component: () => import('pages/EnvironmentPage.vue'),
        children: [
          {path: 'new', component: () => import('components/environment/EmptyEnvironmentForm.vue'), name: 'empty_environment_path'},
          {path: ':id?', component: () => import('components/environment/EnvironmentForm.vue'), name: 'environment_path'}
        ]
      },
      {
        path: 'workbooks', component: () => import('pages/WorkBooksPage.vue'),
        children: [
          {
            path: 'new',
            component: () => import('components/workbook/EmptyWorkBookForm.vue'),
            name: 'empty_workbook_path'
          },
          {path: ':id?', component: () => import('components/workbook/WorkBookForm.vue'), name: 'workbook_path'}
        ]
      }
    ],
  },

  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/Error404.vue'),
  },
];

export default routes;
