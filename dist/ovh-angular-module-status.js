angular.module("ovh-angular-module-status", [
    "ovh-api-services"
]);

"use strict";

angular.module("ovh-angular-module-status").config(["$stateProvider", function ($stateProvider) {
    $stateProvider.state("status", {
        url: "/status",
        templateUrl: "app/module-status/status.html",
        "abstract": true
    });
}]).run(["managerNavbar", "StatusService", "OvhApiStatus", "$translate", "$translatePartialLoader", "$q", function (managerNavbar, StatusService, OvhApiStatus, $translate, $translatePartialLoader, $q) {

    $translatePartialLoader.addPart("ovh-angular-module-status");

    $q.all([
        $translate.refresh(),
        OvhApiStatus.Task().Lexi().query()
    ]).then(function (responses) {
        return responses[1].$promise || $q.when([]);
    }).then(function (_tasks) {
        var subLinks = [];

        var tasks = _.map(_tasks, function (task) {
            task.dateToShow = StatusService.getDateToShow(task);
            return task;
        });

        tasks = StatusService.orderStatusNotification(tasks);

        var i = 0;
        _.forEach(tasks, function (task) {
            if (i >= 10) {
                // false to leave loop
                return false;
            }
            var status = StatusService.getCurrentStatus(task);
            subLinks.push({
                label: task.title,
                url: "#/status/task/" + task.uuid,
                template:
                    '<div class="navbar-notification__body row">' +
                        '<div class="navbar-notification__title col-md-6">' +
                            "<span>" + task.project + "</span>" +
                        "</div>" +
                        '<div class="col-md-6">' +
                            '<div class="navbar-notification__date"><span>' + task.dateToShow.display + "</span></div>" +
                            '<div class="navbar-notification__status"><span>' + status + "</span></div>" +
                        "</div>" +
                    "</div>"
            });
            i++;
            return true;
        });

        var headerTemplate =
            '<div class="navbar-notification-beta__box">' +
                '<h2 class="navbar-notification-beta__title">' + $translate.instant("status_menu_beta_title") + "</h2>" +
                '<p class="navbar-notification-beta__text">' + $translate.instant("status_intro") + "</p>" +
                '<p class="navbar-notification-beta__email">feedbackstatus@corp.ovh.com</p>' +
            "</div>";

        var footerTemplate = "";
        if (subLinks.length === 0) {
            footerTemplate =
            '<div class="navbar-notification__footer navbar-notification__footer_empty">' +
                $translate.instant("status_menu_none") +
            "</div>";

        } else {
            footerTemplate =
                '<div class="navbar-notification__footer">' +
                    '<a class="navbar-notification__button" href="#/status/task">' +
                        $translate.instant("status_menu_see_all") +
                    "</a>" +
                "</div>";
        }

        managerNavbar.internalLinks.unshift({
            listClass: "navbar-notification__list",
            label: $translate.instant("status_menu_title"),
            icon: "navbar-notification__icon",
            subLinks: subLinks,
            headerTemplate: headerTemplate,
            footerTemplate: footerTemplate
        });
    });
}]);

angular.module("ovh-angular-module-status").service("StatusService", ["moment", "$translate", function (moment, $translate) {
    "use strict";

    var self = this;

    this.augmentStatus = function (task) {
        var augmentedTask = _.cloneDeep(task);
        augmentedTask.dateToShow = self.getDateToShow(task);
        return augmentedTask;
    };

    this.getDateToShow = function (task) {
        var dateToShow;
        if (task.endDate) {
            dateToShow = {
                display: moment(task.endDate).format("ll, LTS"),
                date: task.endDate,
                unix: moment(task.endDate).unix()
            };
        } else if (task.type === "maintenance") {
            dateToShow = {
                display: moment(task.startDate).format("ll, LTS"),
                date: task.startDate,
                unix: moment(task.startDate).unix()
            };
        } else if (task.type === "incident") {
            if (task.replies.length > 0) {
                var lastReplay = _.last(task.replies);
                dateToShow = {
                    display: moment(lastReplay.date).format("ll, LTS"),
                    date: lastReplay.date,
                    unix: moment(lastReplay.date).unix()
                };
            } else {
                dateToShow = {
                    display: moment(task.startDate).format("ll, LTS"),
                    date: task.startDate,
                    unix: moment(task.startDate).unix()
                };
            }
        } else {
            dateToShow = {
                display: moment().format("ll, LTS"),
                date: moment(),
                unix: moment().unix()
            };
        }
        return dateToShow;
    };

    this.getCurrentStatus = function (task) {
        return $translate.instant("status_" + task.type + "_" + task.status);
    };

    this.orderStatusNotification = function (taskList) {
        return _.sortBy(taskList, function (task) {
            return moment(task.dateToShow.date);
        }).reverse();
    };
}]);

"use strict";

angular.module("ovh-angular-module-status")
    .config(["$stateProvider", function ($stateProvider) {
        $stateProvider.state("status-task-alert", {
            url: "/status/task/alert",
            templateUrl: "app/module-status/task/alert/status-task-alert.html",
            translations: ["common", "module-status-task-alert"]
        });
    }]);

angular.module("ovh-angular-module-status").controller("StatusTaskDetailCtrl", ["OvhApiStatus", "Toast", "$stateParams", "$translate", function (OvhApiStatus, Toast, $stateParams, $translate) {
    var self = this;


    this.loading = {
        init: true
    };

    this.currentTaskId = $stateParams.uuid;
    this.task = null;

    function init () {
        self.loading.init = true;

        return OvhApiStatus.Task().Lexi().query().$promise.then(function (tasks) {
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

}]);

"use strict";

angular.module("ovh-angular-module-status")
    .config(["$stateProvider", function ($stateProvider) {
        $stateProvider.state("status-task-detail", {
            url: "/status/task/{uuid}",
            templateUrl: "app/module-status/task/detail/status-task-detail.html",
            controller: "StatusTaskDetailCtrl",
            controllerAs: "TaskDetail",
            translations: ["common", "module-status/task/detail"]
        });
    }]);

angular.module("ovh-angular-module-status").controller("StatusTaskCtrl", ["OvhApiStatus", "StatusService", "Toast", "$translate", function (OvhApiStatus, StatusService, Toast, $translate) {
    var self = this;

    this.loading = {
        init: true
    };

    this.orderBy = "dateToShow.unix";
    this.reverse = true;

    this.tasks = [];

    function init () {
        self.loading.init = true;

        return OvhApiStatus.Task().Lexi().query().$promise.then(function (tasks) {
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

}]);

"use strict";

angular.module("ovh-angular-module-status")
    .config(["$stateProvider", function ($stateProvider) {
        $stateProvider.state("status.task", {
            url: "/task",
            views: {
                statusView: {
                    templateUrl: "app/module-status/task/status-task.html"
                },
                "@taskView": {
                    templateUrl: "app/module-status/task/status-task-main.view.html",
                    controller: "StatusTaskCtrl",
                    controllerAs: "StatusTask"
                }
            },
            translations: ["common", "module-status/task"]
        });
    }]);

angular.module('ovh-angular-module-status').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('app/module-status/status.html',
    "<section data-ui-view=statusView></section>"
  );


  $templateCache.put('app/module-status/task/alert/status-task-alert.html',
    "<section class=header-section><header class=header-container role=banner><h1 translate=status_menu_title></h1><a class=section-back-link data-ui-sref=status-task><span><i class=\"ovh-font ovh-font-arrow-left\" aria-hidden=\"\"></i> <span data-translate=\"\">Retour à la liste</span></span></a></header></section><section><h2>SOON</h2></section>"
  );


  $templateCache.put('app/module-status/task/detail/status-task-detail.html',
    "<div class=status-section-header><header role=banner><h1 class=oui-header_1 translate=status_menu_title></h1><a class=section-back-link href=\"\" data-ui-sref=status.task><span><i class=\"ovh-font ovh-font-arrow-left\" aria-hidden=true></i> <span data-translate=status_task_detail_back></span></span></a></header></div><main role=main class=status-task-section-content><section data-ng-if=TaskDetail.loading.init class=text-center><spinner name=bubbles-222-fff-32></spinner><p data-translate=status_task_detail_loading_task></p></section><section data-ng-if=\"!TaskDetail.loading.init && TaskDetail.task\"><div class=\"row bottom-space-m16\"><div class=col-xs-12><h2 data-ng-bind=::TaskDetail.task.title></h2></div></div><div class=\"row bottom-space-m16\"><div class=\"col-xs-8 col-lg-5\"><h4><span data-ng-bind=\"('status_tasks_list_type_label_' + TaskDetail.task.type) | translate\"></span> - <span data-ng-bind=TaskDetail.task.project></span></h4></div><div class=\"col-xs-4 col-lg-7\"><dl class=\"dl-horizontal status-task-dl\"><dt data-translate=status_task_detail_id_label></dt><dd data-ng-bind=TaskDetail.task.reference></dd></dl></div></div><div class=\"row bottom-space-m16\"><div class=col-xs-4><p class=\"label status-task__label status-task__label_normal\" data-ng-bind=\"('status_tasks_list_status_label_' + TaskDetail.task.status) | translate\"></p><p class=\"label status-task__label\" data-ng-class=\"{\n" +
    "                    'status-task__label_major': TaskDetail.task.impact === 'downtime' || TaskDetail.task.impact === 'fullUnavailability',\n" +
    "                    'status-task__label_warning': TaskDetail.task.impact === 'partialUnavailability',\n" +
    "                    'status-task__label_minor': TaskDetail.task.impact === 'none' || TaskDetail.task.impact === 'unknown'\n" +
    "                }\" data-ng-bind=\"('status_tasks_list_impact_label_' + TaskDetail.task.impact) | translate\"></p></div></div><div class=\"row bottom-space-m16\"><div class=\"col-xs-6 text-left\"><dl class=\"dl-horizontal status-task-dl\"><dt><span class=\"glyphicon glyphicon-time\"></span> <span data-translate=status_tasks_detail_start></span></dt><dd data-ng-bind=\"TaskDetail.task.startDate | date:'medium'\"></dd><dt data-ng-if=TaskDetail.task.endDate><span class=\"glyphicon glyphicon-time\"></span> <span data-translate=status_tasks_detail_end></span></dt><dd data-ng-if=TaskDetail.task.endDate data-ng-bind=\"TaskDetail.task.endDate | date:'medium'\"></dd></dl></div></div><div class=\"row bottom-space-m16\"><div class=col-xs-12><p data-ng-bind=TaskDetail.task.details></p></div></div><div class=\"row bottom-space-m16\"><div class=col-xs-12><h3 data-translate=status_task_detail_impacted_title></h3></div><div class=col-xs-12><p data-ng-bind=TaskDetail.task.impactedService></p></div></div><div class=\"row bottom-space-m16\"><div class=col-xs-12><h3 data-translate=status_task_detail_reply_title></h3></div><div class=col-xs-12><div class=row data-ng-if=TaskDetail.task.replies.length data-ng-repeat=\"reply in TaskDetail.task.replies\"><div class=\"col-xs-12 col-md-8 col-lg-5 status-task-detail-reply\"><p data-ng-bind=reply.comment></p><small class=text-muted data-ng-bind=\"reply.date | date:'medium'\"></small></div></div><div class=row data-ng-if=!TaskDetail.task.replies.length><div class=\"col-xs-12 col-md-8 col-lg-5 status-task-detail-reply text-center\"><p data-translate=status_task_detail_no_reply></p></div></div></div></div></section></main>"
  );


  $templateCache.put('app/module-status/task/status-task-main.view.html',
    "<section><div class=row><div class=col-xs-12><table class=oui-table><thead class=oui-table__headers><tr><th class=\"oui-table__header oui-table__cell_sortable\" data-tabindex=0 data-ng-click=\"StatusTask.orderBy = 'product';StatusTask.reverse = !StatusTask.reverse\" data-ng-class=\"{\n" +
    "                                'oui-table__cell_sorted': StatusTask.orderBy === 'product',\n" +
    "                                'oui-table__cell_sortable-asc': !StatusTask.reverse,\n" +
    "                                'oui-table__cell_sortable-desc': StatusTask.reverse\n" +
    "                            }\" data-translate=status_tasks_list_title_product></th><th class=\"oui-table__header oui-table__cell_sortable\" data-tabindex=0 data-ng-click=\"StatusTask.orderBy = 'title';StatusTask.reverse = !StatusTask.reverse\" data-ng-class=\"{\n" +
    "                                'oui-table__cell_sorted': StatusTask.orderBy === 'title',\n" +
    "                                'oui-table__cell_sortable-asc': !StatusTask.reverse,\n" +
    "                                'oui-table__cell_sortable-desc': StatusTask.reverse\n" +
    "                            }\" data-translate=status_tasks_list_title_title></th><th class=\"oui-table__header oui-table__cell_sortable\" data-tabindex=0 data-ng-class=\"{\n" +
    "                                'oui-table__cell_sorted': StatusTask.orderBy === 'type',\n" +
    "                                'oui-table__cell_sortable-asc': !StatusTask.reverse,\n" +
    "                                'oui-table__cell_sortable-desc': StatusTask.reverse\n" +
    "                            }\" data-ng-click=\"StatusTask.orderBy = 'type'; StatusTask.reverse = !StatusTask.reverse\" data-translate=status_tasks_list_type_title></th><th class=\"oui-table__header oui-table__cell_sortable\" data-tabindex=0 data-ng-class=\"{\n" +
    "                                'oui-table__cell_sorted': StatusTask.orderBy === 'status',\n" +
    "                                'oui-table__cell_sortable-asc': !StatusTask.reverse,\n" +
    "                                'oui-table__cell_sortable-desc': StatusTask.reverse\n" +
    "                            }\" data-ng-click=\"StatusTask.orderBy = 'status';StatusTask.reverse = !StatusTask.reverse\" data-translate=status_tasks_list_state_title></th><th class=\"oui-table__header oui-table__cell_sortable\" data-tabindex=0 data-ng-class=\"{\n" +
    "                                'oui-table__cell_sorted': StatusTask.orderBy === 'dateToShow.unix',\n" +
    "                                'oui-table__cell_sortable-asc': !StatusTask.reverse,\n" +
    "                                'oui-table__cell_sortable-desc': StatusTask.reverse\n" +
    "                            }\" data-ng-click=\"StatusTask.orderBy = 'dateToShow.unix';StatusTask.reverse = !StatusTask.reverse\" data-translate=status_tasks_list_date_title></th><th class=\"oui-table__header oui-table__cell_sortable\" data-tabindex=0 data-ng-class=\"{\n" +
    "                                'oui-table__cell_sorted': StatusTask.orderBy === 'details',\n" +
    "                                'oui-table__cell_sortable-asc': !StatusTask.reverse,\n" +
    "                                'oui-table__cell_sortable-desc': StatusTask.reverse\n" +
    "                            }\" data-ng-click=\"StatusTask.orderBy = 'details';StatusTask.reverse = !StatusTask.reverse\" data-translate=status_tasks_list_details_title></th><th class=\"oui-table__header text-center\"><b data-translate=status_tasks_action_title></b></th></tr></thead><tbody class=oui-table__body data-ng-if=\"StatusTask.tasks.length && !StatusTask.loading.init\"><tr class=oui-table__row tabindex=0 data-ng-repeat=\"task in StatusTask.tasks | orderBy:StatusTask.orderBy:StatusTask.reverse\"><td class=oui-table__cell data-ng-bind=\"('status_tasks_list_product_label_' + task.project) | translate\"></td><td class=oui-table__cell data-ng-bind=::task.title></td><td class=oui-table__cell data-ng-bind=\"('status_tasks_list_type_label_' + task.type) | translate\"></td><td class=oui-table__cell data-ng-bind=\"('status_tasks_list_status_label_' + task.status) | translate\"></td><td class=oui-table__cell data-ng-bind=::task.dateToShow.display></td><td class=oui-table__cell data-ng-bind=::task.details></td><td class=\"oui-table__cell text-center\"><button class=\"oui-button oui-button_dropdow\" data-toggle=dropdown aria-haspopup=true aria-expanded=false><i class=\"ovh-font ovh-font-dots\"></i></button><ul class=dropdown-menu><li><a data-ui-sref=\"status-task-detail({ uuid: task.uuid })\" href=\"\" data-translate=status_tasks_list_see_more></a></li></ul></td></tr></tbody><tbody class=oui-table__body data-ng-if=\"!StatusTask.tasks.length && !StatusTask.loading.init\"><tr class=oui-table__row tabindex=0><td class=\"oui-table__cell center\" colspan=6 data-translate=status_tasks_list_no_tasks></td></tr></tbody><tbody class=oui-table__body data-ng-if=\"!StatusTask.tasks.length && StatusTask.loading.init\"><tr class=oui-table__row tabindex=0><td class=\"oui-table__cell text-center\" colspan=6><spinner name=bubbles-222-fff-32></spinner><p data-translate=status_tasks_list_loading_tasks></p></td></tr></tbody></table></div></div></section>"
  );


  $templateCache.put('app/module-status/task/status-task.html',
    "<div class=status-section-header><header role=banner><h1 class=oui-header_1 translate=status_menu_title></h1></header><nav role=navigation><responsive-tabs><responsive-tab data-state=\"{{ ::'status.task' }}\" dropdown-title=\"{{'status_tasks_list_title'|translate}}\"><span data-translate=status_tasks_list_title></span></responsive-tab><responsive-tab-more><i class=\"fa fa-plus\"></i></responsive-tab-more></responsive-tabs></nav></div><main class=status-task-section-content role=main data-ui-view=@taskView></main>"
  );

}]);
