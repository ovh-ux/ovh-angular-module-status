"use strict";

angular.module("ovh-angular-module-status")
    .config(function ($stateProvider) {
        $stateProvider.state("status.task.detail", {
            url: "/{uuid}",
            views: {
                "headerStatusView@status": {
                    templateUrl: "app/module-status/task/detail/status-detail-header.html"
                },
                "mainStatusView@status": {
                    templateUrl: "app/module-status/task/detail/status-task-detail.html",
                    controller: "StatusTaskDetailCtrl",
                    controllerAs: "TaskDetail"
                }
            },
            translations: ["common", "module-status/task/detail"]
        });
    });
