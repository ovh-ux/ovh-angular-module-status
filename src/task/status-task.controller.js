angular.module("ovh-angular-module-status").controller("StatusTaskCtrl", function (Status, StatusService, Toast, $translate) {
    var self = this;

    this.loading = {
        init: true
    };

    this.orderBy = "dateToShow.unix";
    this.reverse = true;

    this.tasks = [];

    function init () {
        self.loading.init = true;

        return Status.Task().Lexi().query().$promise.then(function (tasks) {
            self.tasks = _.map(tasks, StatusService.augmentStatus);
            self.tasks = StatusService.orderStatusNotification(self.tasks);
            return self.tasks;
        }).catch(function (error) {
            return Toast.error([$translate.instant("status_tasks_init_error"), error.data.message].join(" "));
        }).finally(function () {
            self.loading.init = false;
        });
    }

    init();

});
