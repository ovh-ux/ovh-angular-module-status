"use strict";

angular.module("ovh-angular-module-status")
    .config(function ($stateProvider) {
        $stateProvider.state("status.task", {
            url: "/task",
            redirectTo: "status.task.list",
            translations: ["common", "module-status/task"]
        });
    });
