var myApp = angular.module('myApp', []);

myApp.controller('mainController', function($scope, $log, $filter) {
  $scope.name = "Bob";
  $scope.formatName = $filter('uppercase')($scope.name);

  $log.info($scope.name);
  $log.info($scope.formatName);
})

