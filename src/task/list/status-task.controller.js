angular.module("ovh-angular-module-status").controller("StatusTaskCtrl", function ($state, OvhApiStatus, StatusService, Toast, $translate) {
    var self = this;

    this.tasks = undefined;

    self.getTasks = function () {
        return OvhApiStatus.Task().Lexi().query().$promise.then(function (tasks) {
            self.tasks = _.map(tasks, StatusService.augmentStatus);
            self.tasks = StatusService.orderStatusNotification(self.tasks);
            return {
                data: self.tasks,
                meta: {
                    totalCount: self.tasks.length
                }
            };
        }).catch(function (error) {
            return Toast.error([$translate.instant("status_tasks_init_error"), error.data.message].join(" "));
        });
    };

    self.goSeeDetails = function (uuid) {
        $state.go("status.task.detail", { uuid: uuid });
    };

});
