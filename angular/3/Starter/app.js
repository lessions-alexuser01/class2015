var myApp = angular.module('myApp', []);

myApp.controller('mainController', [ "$scope", "$timeout", "$log", function($scope, $timeout, $log) {
    $scope.name = 'Alex';
    $timeout(function(){
    	$scope.name = 'Everybody';
    }, 1000);
    $log.info($scope);
}]);