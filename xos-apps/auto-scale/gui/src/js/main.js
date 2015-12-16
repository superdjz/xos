'use strict';

angular.module('autoscaling', [
  'ngLodash',
  'ui.router',
  'ngAnimate',
  'chart.js'
])
.run(() => {
  console.log('autoscaling is running');
})
.config(($stateProvider, $urlRouterProvider) => {
  $stateProvider
  .state('ceilometerDashboard', {
    url: '/',
    template: '<service-container></service-container>'
  });
  
  $urlRouterProvider.otherwise('/');
});
