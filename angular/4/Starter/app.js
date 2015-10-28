var myApp = angular.module('myApp', []);

myApp.controller('mainController', ['$scope', '$filter', '$timeout', function($scope, $filter, $timeout) {
    
    $scope.handle = '';

    $scope.$watch('handle', function(newValue, oldValue){
    	console.info("Changed!");
    	console.log("old :", oldValue);
    	console.log("new :", newValue);
    });
    
    $scope.lowerCaseHandle = (function() {
    	return $filter('lowercase')($scope.handle);
    });

    // setTimeout(function() {

    // 	$scope.$apply(function() {		// this is needed to let angular know to look at this
	   //  	$scope.handle = 'newTwitterHandle';
	   //  	console.log('Scope changed!');
	   //  });

    // }, 1000);
    
    $timeout(function() {
    	$scope.handle = 'newTwitterHandle';
    	console.log('Scope changed within timeout!');
    }, 1000);

    
}]);
