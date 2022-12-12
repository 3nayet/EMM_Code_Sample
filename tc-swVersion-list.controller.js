(function () {
  'use strict';
  angular
    .module('OCWEB')
    .controller('SoftwareVersionListController', SoftwareVersionListController);

  function SoftwareVersionListController($scope, $translate, $filter, $rootScope, SwVersionService, UtilsService, PopUpService, UserPrivileges) {
    $scope.isLoading = true;
    // Initialize Controller.
    const vm = this;
    let swVersion2Mod;
    // VM Variables.
    vm.conditionOptions = {};

    var replaceComma = window.EXT_CONF.REPLACE_DECIMAL_SEPARATOR;
    if(replaceComma === true) {
      // sets thousands separator "." and decimal separator "."
      kendo.culture("de-DE");
    }
    //#endregion

    // VM functions.
    // VM Init: function calls.
    // Retrieving filters values
    initializeWithTranslations();

    function initializeWithTranslations(){
      if ($rootScope.translationAvailable) {
        // VM Init: function calls.
        initialize();
        } else {
        var translateEvent = $rootScope.$on('$translateChangeSuccess', function(){
          translateEvent();
          // VM Init: function calls.
          initialize();
        });
      }
    }
    vm.checkSoftwareVersionUserPrivilege = checkSoftwareVersionUserPrivilege;

    // Function definition (nothing else should go below this line).
    function initialize() {
      $scope.isLoading = true;
      SwVersionService.getSoftwareVersionsFilters()
        .then(onGetSoftwareVersionListFiltersResponse, onRequestReject)
        .finally(function () {
          loadingFinished();
          onGetSoftwareVersionResponse(null, false);
          presetConditions();
        });
    }

    function checkSoftwareVersionUserPrivilege () {
      return UserPrivileges.getPrivilegedItem(['TC_SW_VERSION_LIST']);
    }

   // function to preset conditions
    function presetConditions() {
    }

    function cancelPressed(e) {
    	searchHandler();
    }

    function loadingFinished() {
      $scope.isLoading = false;
    }

    function onRequestReject(rejectResponse) {
      console.log(rejectResponse);
    }

    // ::::::::::: start editor functions :::::::::::::
    function saveSWVersion(softwareVersion) {
    	//Extract
      var newSoftwareVersion = {
        appId: softwareVersion.appId.toUpperCase(),
        urlTC: softwareVersion.urlTC? softwareVersion.urlTC: "",
        dateTC: softwareVersion.dateTC? softwareVersion.dateTC: null,
        swVersion: softwareVersion.swVersion? softwareVersion.swVersion: "",
        message: softwareVersion.message?softwareVersion.message: "",
        messageValidity : softwareVersion.messageValidity?softwareVersion.messageValidity:null
      };
      if(softwareVersion.swId)
        SwVersionService.modifySoftwareVersion(newSoftwareVersion).then(onModifySoftwareVersionResponse, onModRequestReject);
      else
        SwVersionService.newSoftwareVersion(newSoftwareVersion).then(onSaveSoftwareVersionResponse, onModRequestReject);
    }

    function onGetSoftwareVersionListFiltersResponse(response) {
      if (response) {
        vm.appId = [];
        vm.conditionOptions = {
          name: "swVersionList",
          disablePersistance: true,
          conditions: [
            {
              field: 'appId',
              label: 'SW_VERSION_LIST_FILTERS_APP_ID',
              type: 'multiselect',
              options: {
                placeholder: $translate.instant('GLB_SELECT'),
                valuePrimitive: true,
                autoBind: false,
                ngModel: vm.appId,
                dataSource: response.appId
              }
            },
          ],
          search: searchHandler
        };
      }
    }

    function searchHandler() {
    $scope.isLoading = true;

    var searchCriteria = vm.conditionOptions.getJsonRequest();
    console.log("search handler called with criteria " + searchCriteria)
      SwVersionService.getSoftwareVersionList(searchCriteria)
        .then(onGetSoftwareVersionResponse, onRequestReject)
        .finally(loadingFinished);
    }

    function onModRequestReject(rejectResponse) {
    	setTimeout(function () {
    		PopUpService.errorPopUp($translate.instant('GLB_ERROR'), $translate.instant('GLB_SERVER_GENERIC_ERROR'));
    	}, 200);
    }

    function onSaveSoftwareVersionResponse(response) {
      PopUpService.closePopUp();
      setTimeout(function () {
        if (response.ok) {
          PopUpService.successPopUpFunction($translate.instant('SW_VERSION_LIST_POPUP_CREATE_SW_VERSION'),
        		  $translate.instant('GLB_INSERT_SUCCEEDED'),
        		  searchHandler);
        } else {
        		PopUpService.errorPopUp($translate.instant('SW_VERSION_LIST_POPUP_CREATE_SW_VERSION'),
        				$translate.instant('GLB_ERROR'));
        }
      }, 200);

    }

    function onModifySoftwareVersionResponse(response) {
      PopUpService.closePopUp();
      setTimeout(function () {
        if (response.ok) {
          PopUpService.successPopUpFunction($translate.instant('SW_VERSION_LIST_POPUP_MODIFY_SW_VERSION'),
        		  $translate.instant('GLB_UPDATE_SUCCEEDED'),
        		  searchHandler);
        } else {
        		PopUpService.errorPopUp($translate.instant('SW_VERSION_LIST_POPUP_MODIFY_SW_VERSION'),
        				$translate.instant('GLB_ERROR'));
        }
      }, 200);
    }

    function setDatePicker(container, options){
    $('<input name="' + options.field + '" >').appendTo(container)
        .kendoDatePicker({
         format: "yyyy-MM-dd"
         });
    }

    function setTimePicker(container, options){
    $('<input name="' + options.field + '" >').appendTo(container)
        .kendoDateTimePicker({
         format: "yyyy-MM-ddTHH:mmzzz"
         });
    }

    function onGetSoftwareVersionResponse(response, closeSideBar) {
    console.log("accessing ong GetSofwareVersionResonse: " + response);
    console.log("with data " + response.data)
      closeSideBar = (typeof closeSideBar !== 'undefined') ?  closeSideBar : true;
      if(response == null || !response.ok){
        console.log(response);
        response={
          dataList:[]
        };
      }

      vm.errorMsg = response.beerrorMsg;

      if (response.dataList != null && response.dataList != undefined) {
        // fire an event to close the filters and menu
        if(closeSideBar)
          $rootScope.$broadcast('onListLoad');

      let swDataSource = response.dataList.map((item, index) =>{
      item.swId= index+1;
      if(item.dateTC){
        var myDate = new Date(parseInt(item.dateTC));
        if (isNaN(myDate.getFullYear()) || item.dateTC === 0 || item.dateTC === '')
           item.dateTC= '';
        else
           item.dateTC= kendo.toString(myDate, "yyyy-MM-dd");
           }
        if(item.messageValidity){
        var myDate = new Date(parseInt(item.messageValidity));
        if (isNaN(myDate.getFullYear()) || item.messageValidity === 0 || item.messageValidity === '')
           item.messageValidity= '';
        else
           item.messageValidity= kendo.toString(myDate, "yyyy-MM-ddTHH:mmzzz");
           }
           } );
        //Create swVersionListGridData and datasource
        vm.swVersionListGridData = new kendo.data.ObservableArray(response.dataList);
        vm.swVersionListGridDataSource = {
            data: vm.swVersionListGridData,
            pageSize: 50
        };

        //Create table options
        // table options
        vm.swVersionListGridOptions = {
          height: UtilsService.calcTableHeight(undefined, '.swList-table-container'),
          dataSource: {
            transport: {
              read: function (o) {
                // pass the date
                o.success(response.dataList);
              },
              create: function (o) {
                let item = o.data;
                // assign a unique ID and return the record
                counter++;
                item.swId = counter;
                o.success(item);
              },
              update: function (o) {
                o.success();
              },
              destroy: function (o) {
                o.success();
              }
            },
           data: swDataSource,
            schema: {
              model: {
                id: 'swId',
                fields: {
                  appId: {
                    type: 'string',
                    validation: { required: { message: '{{"FORM_ERR_MANDATORY" | translate}}' }, max: 64 }
                  },
                  urlTC: {
                    type: 'string',
                    validation: { required: { message: '{{"FORM_ERR_MANDATORY" | translate}}' }, max: 100 }
                  },
                          dateTC: {
                    type: 'date',
                    parse: function (value) {
                      var myDate = new Date(parseInt(value));
                      if (isNaN(myDate.getFullYear()) || value === 0 || value === '')
                        return '';

                      return kendo.toString(myDate, "yyyy-MM-dd");
                    },
//                    validation: { required: { message: '{{"FORM_ERR_MANDATORY" | translate}}' }},

                  },
                  swVersion: {
                    type: 'string',
                    validation: { required: { message: '{{"FORM_ERR_MANDATORY" | translate}}' }, max: 64 },
                  },
                 message: {
                    type: 'string',
                    validation: { required: { message: '{{"FORM_ERR_MANDATORY" | translate}}' }, max: 200 },
                  },
                 messageValidity: {
                    type: 'date',
                    parse: function (value) {
                       var myDate = new Date(parseInt(value));
                       if (isNaN(myDate.getFullYear()) || value === 0 || value === '')
                         return '';

                       return kendo.toString(myDate, "yyyy-MM-ddTHH:mmzzz");
                     },
                    validation: { required: { message: '{{"FORM_ERR_MANDATORY" | translate}}' }, max: 64 },
                  },

                  }
                }
              }
            },
            sortable: true,
            scrollable: true,
            pageable: {
              pageSizes: [100, 200, 500],
              buttonCount: 3,
              messages: {
                display: $translate.instant('GLB_RESULTS') + ':{2}',
                itemsPerPage: '',
                first: $translate.instant('PAGINATOR_FIRST_PAGE'),
                previous: $translate.instant('PAGINATOR_PREV_PAGE'),
                next: $translate.instant('PAGINATOR_NEXT_PAGE'),
                last: $translate.instant('PAGINATOR_LAST_PAGE')
              }
            },
            toolbar: [{
              name: 'create',
              text: '{{"SW_VERSION_LIST_HEADER_CREATE_NEW_SWVERSION" | translate}}',
              template: '<a class="k-button k-button-icontext k-grid-add" ng-if="vm.checkSoftwareVersionUserPrivilege()"><span class="k-icon k-add"></span>{{"SW_VERSION_LIST_HEADER_CREATE_NEW_SWVERSION"|translate}}</a>'
            }],
            columns: [
              {
                field: 'appId',
                title: $translate.instant('SW_VERSION_LIST_APP_ID'),
                headerTemplate: '<span translate="SW_VERSION_LIST_APP_ID"> </span>',
              },
              {
                field: 'urlTC',
                title: $translate.instant('SW_VERSION_LIST_URL_TC'),
                headerTemplate: '<span translate="SW_VERSION_LIST_URL_TC"> </span>',
              },
              {
                field: 'dateTC',
                title: $translate.instant('SW_VERSION_LIST_DATE_TC'),
                headerTemplate: '<span translate="SW_VERSION_LIST_DATE_TC"> </span>',
                format: "{0:yyyy-MM-dd}",
                editor:setDatePicker
              },
               {
                field: 'swVersion',
                title: $translate.instant('SW_VERSION_LIST_SW_VERSION'),
                headerTemplate: '<span translate="SW_VERSION_LIST_SW_VERSION"> </span>',
              },
              {
                field: 'message',
                title: $translate.instant('SW_VERSION_LIST_MESSAGE'),
                headerTemplate: '<span translate="SW_VERSION_LIST_MESSAGE"> </span>',
              },
              {
                field: 'messageValidity',
                title: $translate.instant('SW_VERSION_LIST_MESSAGE_VALIDITY'),
                headerTemplate: '<span translate="SW_VERSION_LIST_MESSAGE_VALIDITY"> </span>',
                format: "{0:yyyy-MM-ddTHH:mmzzz}",
                editor:setTimePicker
              },
              {
              headerTemplate: '<span>Action</span>',
                command: [
                  {
                    name: 'edit',
                    template: '<a class="k-button k-button-icontext k-grid-edit" ng-if="vm.checkSoftwareVersionUserPrivilege()"><span class="k-icon k-edit"></span>{{"GLB_EDIT"|translate}}</a>',
                    text: $translate.instant('GLB_EDIT')
                  }
                ],
                title: '&nbsp;',
                width: '200px'
              }
            ],
            editable: 'inline',
            edit: function (e) {
              //Disable sorting columns
              let sortLinks = $('th[data-role="columnsorter"]');
              sortLinks.unbind("click");

              //add required attribute to edit form
              e.container.find("input[name=appId]").attr("required",true);

            },
            save: function (e) {
              e.container.find("input[name=appId]").attr("required",true);

              swVersion2Mod = e.model;
              let title;
              if(e.model.swId) {
                title = 'SW_VERSION_LIST_MODIFY_SW_VERSION';
              }
              else {
                title = 'SW_VERSION_LIST_CREATE_SW_VERSION';
              }
              PopUpService.confirmPopUp(
                $translate.instant(title),
                "",
                $translate.instant('CU_CONFIGURATION_BUTTON_CONFIRM'),
                function () {
                  // confirm
                  saveSWVersion(swVersion2Mod);
                },
                function () {
                  // cancel
                }
              );
            },
            remove: function (e) {
              $scope.pageState.podsCount--;
            },
            dataBound: function () {
              $filter('addGridTooltip')('SwVersionListGrid');
              UtilsService.addExportButton('SwVersionListGrid');
              $("#SwVersionListGrid").on("mousedown", ".k-grid-cancel", cancelPressed);
            }
          };

        //Call grid show
        $("#SwVersionListGrid").show();
      }

    }

  }

})();
