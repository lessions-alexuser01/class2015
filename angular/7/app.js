var myApp = angular.module('myApp', []);

myApp.controller('mainController', ['$scope', '$filter', function($scope, $filter) {
    
    $scope.handle = '';
    
    $scope.lowercasehandle = function() {
        return $filter('lowercase')($scope.handle);
    };
    
    $scope.characters = 5;
    
    var rulessrequest = new XMLHttpRequest();
    rulessrequest.onreadystatechange = function () {
        
      $scope.$apply( function() {  
        if (rulessrequest.readyState == 4 && rulessrequest.status == 200) {
            $scope.rules = JSON.parse(rulessrequest.responseText);
        }
      });  
        
    }
    
    rulessrequest.open("GET", "http://localhost:3000/rules", true);
    rulessrequest.send();
    
}]);
