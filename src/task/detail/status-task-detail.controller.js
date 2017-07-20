angular.module("ovh-angular-module-status").controller("StatusTaskDetailCtrl", function (Status, Toast, $stateParams, $translate) {
    var self = this;


    this.loading = {
        init: true
    };

    this.currentTaskId = $stateParams.uuid;
    this.task = null;

    function init () {
        self.loading.init = true;

        return Status.Task().Lexi().query().$promise.then(function (tasks) {
            self.task = _.find(tasks, function (task) {
                return task.uuid === self.currentTaskId;
            });
            return self.task;
        }, function (error) {
            return Toast.error([$translate.instant("status_task_detail_init_error"), error.data.message].join(" "));
        }).finally(function () {
            self.loading.init = false;
        });
    }

    init();

});
