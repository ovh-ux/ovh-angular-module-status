"use strict";

angular.module("ovh-angular-module-status")
    .config(function ($stateProvider) {
        $stateProvider.state("status-task-detail", {
            url: "/status/task/{uuid}",
            templateUrl: "app/module-status/task/detail/status-task-detail.html",
            controller: "StatusTaskDetailCtrl",
            controllerAs: "TaskDetail",
            translations: ["common", "module-status/task/detail"]
        });
    });
