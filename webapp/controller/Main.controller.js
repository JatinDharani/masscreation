/**
 * 
 *//*global XLSX*/
 sap.ui.define([
    "com/amadeus/fiori/ppm/commons/controller/DetailsController",
    "com/amadeus/fiori/ppm/commons/controls/TablePersoController",
    "com/amadeus/fiori/ppm/commons/list/TablePersoService",
    "com/amadeus/fiori/ppm/commons/util/CommonFormatter",
    "com/amadeus/fiori/ppm/commons/util/Utils",
    "sap/ui/unified/FileUploader",
    "com/amadeus/fiori/ppm/ipf/deiverables/masscreation/util/formatter",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    'sap/m/MessageItem',
    'sap/m/MessageView',
    'sap/m/Button',
    'sap/m/Dialog',
    'sap/m/Token',
    'sap/m/Bar',
    'sap/ui/core/IconPool',
    "com/amadeus/fiori/ppm/commons/util/TreeTableUtils",
    "sap/ui/core/Fragment",
    "sap/ui/export/Spreadsheet",
], function (
    DetailsController,
    TablePersoController,
    TablePersoService,
    CommonFormatter,
    Utils,
    FileUploader,
    formatter,
    MessageBox,
    JSONModel,
    Filter,
    FilterOperator,
    MessageToast,
    MessageItem,
    MessageView,
    Button,
    Dialog,
    Token,
    Bar,
    IconPool,
    TreeTableUtils,
    SAPFragment,
    Spreadsheet
) {

    "use strict";

    return DetailsController.extend("com.amadeus.fiori.ppm.ipf.deiverables.masscreation.controller.Main", {

        _formFragments: {},
        formatter: formatter,
        commonFormatter: CommonFormatter,
        oParents: null,
        fragmentId: null,
        sPhaseHelpFragment: "com.amadeus.fiori.ppm.ipf.deiverables.masscreation.fragments.PhaseVh",
        sTicketSystHelpFragment: "com.amadeus.fiori.ppm.ipf.deiverables.masscreation.fragments.TicketSystVh",
        sDeliverableHelpFragment: "com.amadeus.fiori.ppm.ipf.deiverables.masscreation.fragments.DeliverableVh",
        sTeamTreeFragment: "com.amadeus.fiori.ppm.ipf.deiverables.masscreation.fragments.TeamTreeTable",
        sVendorsHelpFragment: "com.amadeus.fiori.ppm.ipf.deiverables.masscreation.fragments.VendorHelp",
        oTreeData: null,
        oSelectedTreeData: { Id: "", Type: "" },
        iSelectedLine: 0,


        /**
         * Initialize the view
         */
        onInit: function () {
            DetailsController.prototype.onInit.call(this);
            this.messages = [];
            this.setModel(new JSONModel(), "ListServiceOrder");
            this.getModel("ListServiceOrder").setData([]);
            this.getView().setModel(this.ListServiceOrder, "ListServiceOrderModel");
            this.getRouter().getRoute("main").attachPatternMatched(this.routeMatched, this);
            this.setModel(new JSONModel(), "update");
            this.getModel("update").setData([]);
            this.oTPC = new TablePersoController({
                table: this.getView().byId("MainTable"),
                persoService: TablePersoService,
                tableType: "Update"
            });
        },

        onAfterRendering: function () {
            // for dev only
            // this.onAddNewLinePressed(null);
            // this.getView().getModel("ListServiceOrder").setProperty("/0/ParentId", "99-009127");
        },

        routeMatched: function () {
            this.pfTree = new PfTree(this, TreeTableUtils);
            this.pfTree.init();
        },

        portfolioDialogOpen: function (oEvent) {
            // Catch path from event delete line
            var sPath = oEvent.getSource().getBindingContext('ListServiceOrder').getPath();
            // Replace / on the object oPath
            var oRow = sPath.replace('/', "");

            // convert to integer oRow
            var oRowInt = parseInt(oRow);
            this.iSelectedLine = oRowInt;

            this.pfTree.dialogOpen(oEvent);
        },
        /***********************************************************************
         * Phase released
         **********************************************************************/
        onVhPhase: function (oEvent) {
            // Catch path from event delete line
            var sPath = oEvent.getSource().getBindingContext('ListServiceOrder').getPath();
            // Replace / on the object oPath
            var oRow = sPath.replace('/', "");
            // convert to integer oRow
            var oRowInt = parseInt(oRow);
            this.iSelectedLine = oRowInt;
            this._callFragmentHelp(this.sPhaseHelpFragment, "IAOS_PHASE_RELEASED", oEvent.getSource().getValue());
        },

        _onVhSearchPhase: function (evt) {
            // Attach once to avoid multiple triggers as we can reopen the same
            // popup
            var oBinding = evt.getSource().getBinding("items");
            oBinding.attachEventOnce("change", function (e) {
                this._refocusSearch();
            }.bind(this));
            evt.getSource().getBinding("items").filter(this._createValueHelpFilter("IAOS_PHASE_RELEASED", evt.getParameter("value")));
        },

        onPhaseSuggest: function (oEvent) {
            var sTerm = oEvent.getParameter("suggestValue");
            var aFilters = this._createValueHelpFilter("IAOS_PHASE_RELEASED", sTerm);
            oEvent.getSource().getBinding("suggestionItems").filter(aFilters);
        },

        _onVhClosePhase: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            var aListServiceOrder = this.getModel("ListServiceOrder").getData();
            if (!aListServiceOrder[this.iSelectedLine]) {
                return;
            }
            if (oSelectedItem) {
                aListServiceOrder[this.iSelectedLine].ParentId = oSelectedItem.getDescription();
                this.getModel("ListServiceOrder").setData(aListServiceOrder);
            }
            this._pValueHelpDialog = null;
        },
        onDeliverableChange: function (oEvent) {
            return;
            var selectedKey = oEvent.getSource().getSelectedKey(),
                sPath = oEvent.getSource().getBindingContext("ListServiceOrder").getPath();
            if (selectedKey != "") {
                oEvent.getSource().getBindingContext("ListServiceOrder").getModel().setProperty(sPath + "/Deliverable", selectedKey);
                oEvent.getSource().setValue(selectedKey);
            }
        },
        onDeliverableSuggest: function (oEvent) {
            return;
            var aFilters = [],
                aAndFilters = [],
                sParentId = oEvent.getSource().getBindingContext("ListServiceOrder").getProperty("ParentId"),
                sSuggestedValue = oEvent.getParameter("suggestValue"),
                sTerm = sSuggestedValue.toUpperCase(),
                sItemId = "";
            if (sParentId) {
                var aWords = sParentId.split("-");
                sItemId = aWords[0] + "-" + aWords[1];
            }
            if (sTerm) {
                aFilters.push(new Filter("SearchString", FilterOperator.Contains, sTerm));
            }
            aFilters.push(new Filter("Item", FilterOperator.EQ, sItemId));
            aFilters.push(new Filter("SystemStatus", FilterOperator.EQ, 'CRTD'));
            aAndFilters.push(new Filter(aFilters, true));
            if (aAndFilters.length > 0) aFilters = aAndFilters;

            oEvent.getSource().getBinding("suggestionItems").filter(aFilters);
            //oEvent.getSource().setFilterSuggests(false); 			//Do not filter the provided suggestions before showing them to the user
        },
        /***********************************************************************
         * Ticket Syst
         **********************************************************************/
        onVhTicketSyst: function (oEvent) {
            // Catch path from event delete line
            var sPath = oEvent.getSource().getBindingContext('ListServiceOrder').getPath();
            // Replace / on the object oPath
            var oRow = sPath.replace('/', "");
            // convert to integer oRow
            var oRowInt = parseInt(oRow);
            this.iSelectedLine = oRowInt;
            this._callFragmentHelp(this.sTicketSystHelpFragment, "IAOS_TICKET_SYST", oEvent.getSource().getValue());
        },

        _onVhSearchTicketSyst: function (evt) {
            // Attach once to avoid multiple triggers as we can reopen the same
            // popup
            var oBinding = evt.getSource().getBinding("items");
            oBinding.attachEventOnce("change", function (e) {
                this._refocusSearch();
            }.bind(this));
            evt.getSource().getBinding("items").filter(this._createValueHelpFilter("IAOS_TICKET_SYST", evt.getParameter("value")));
        },

        _onVhCloseTicketSyst: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            var aListServiceOrder = this.getModel("ListServiceOrder").getData();
            if (!aListServiceOrder[this.iSelectedLine]) {
                return;
            }
            if (oSelectedItem) {
                aListServiceOrder[this.iSelectedLine].HcsOrdExtsyst = oSelectedItem.getDescription();
                this.getModel("ListServiceOrder").setData(aListServiceOrder);
            }
            this._pValueHelpDialog = null;
        },

        onTicketSystSuggest: function (oEvent) {
            var sTerm = oEvent.getParameter("suggestValue");
            var aFilters = this._createValueHelpFilter("IAOS_TICKET_SYST", sTerm.toUpperCase());
            oEvent.getSource().getBinding("suggestionItems").filter(aFilters);
        },

        /**
         * Catch Message after Upload file
         */
        handleUploadComplete: function (oEvent) {
            var sResponse = oEvent.getParameter("response"),
                iHttpStatusCode = parseInt(/\d{3}/.exec(sResponse)[0]),
                sMessage;
            if (sResponse) {
                sMessage = iHttpStatusCode === 200 ? sResponse + " (Upload Success)" : sResponse + " (Upload Error)";
                MessageToast.show(sMessage);
            }
        },
        /**
         * Catch Message after during Upload file
         */
        handleUploadPress: function () {
            var oFileUploader = this.byId("fileUploader");
            if (!oFileUploader.getValue()) {
                MessageToast.show("Choose a file first");
                return;
            }
            oFileUploader.checkFileReadable().then(function () {
                oFileUploader.upload();
            }, function (error) {
                MessageToast.show("The file cannot be read. It may have changed.");
            }).then(function () {
                oFileUploader.clear();
            });
        },


        /**
         * Button add new line and when added it is possible to add just one
         */
        onAddNewLinePressed: function (oEvent) {
            // Add new line and new line is editable by 25
            var oBundle = this.getModel("i18n").getResourceBundle(),
                data = [],
                databackup = [],
                sLine = "",
                length = 25, // user defined length
                aListServiceOrder = this.getView().getModel("ListServiceOrder").getData();

            // start process dialogue
            Utils.openBusyDialog(this);

            // Check Array is empty
            if (aListServiceOrder.length === 0) {

                // Add line by line until 25
                for (var i = 0; i < length; i++) {

                    // Initialization line with value empty and set Display
                    // warning to FALSE and set button visibility to FALSE
                    sLine = {
                        HcsOrdExtDesc: "",
                        ParentId: "",
                        HcsOrdExtsyst: "",
                        HcsOrdExtId: "",
                        OrderId: "",
                        SortField: "",
                        Warning: [],
                        WarningCount: 0,
                        DisplayWarning: false,
                        EditableLine: true
                    };

                    // SO Description Add waning message :
                    // ErrorMessage_Missing_filled_HcsOrdExtDesc=SO description
                    // missing
                    if (sLine.HcsOrdExtDesc === "") {
                        sLine.Warning.push({
                            code: '',
                            message: oBundle.getText("ErrorMessage_Missing_filled_HcsOrdExtDesc"),
                            severity: "E",
                            target: ''
                        });
                    }

                    // ParentId Add waning message :
                    // ErrorMessage_Missing_filled_ParentId=Parent missing
                    if (sLine.ParentId === "") {
                        sLine.Warning.push({
                            code: '',
                            message: oBundle.getText("ErrorMessage_Missing_filled_ParentId"),
                            severity: "E",
                            target: ''
                        });
                    }

                    // Ticket system Add waning message :
                    // ErrorMessage_Missing_filled_HcsOrdExtsyst=Ticket system
                    // missing
                    if (sLine.HcsOrdExtsyst !== "") {
                        sLine.Warning.push({
                            code: '',
                            message: oBundle.getText("ErrorMessage_Missing_filled_HcsOrdExtsyst"),
                            severity: "E",
                            target: ''
                        });
                    }

                    // Ticket ID Add waning message :
                    // ErrorMessage_Missing_filled_HcsOrdExtId=Ticket ID missing
                    if (sLine.HcsOrdExtId === "") {
                        sLine.Warning.push({
                            code: '',
                            message: oBundle.getText("ErrorMessage_Missing_filled_HcsOrdExtId"),
                            severity: "E",
                            target: ''
                        });
                    } else {
                        if (sLine.HcsOrdExtsyst === "IPPM") {
                            sLine.Warning.push({
                                code: '',
                                message: oBundle.getText("ErrorMessage_Missing_filled_IPPM_HcsOrdExtId"),
                                severity: "E",
                                target: ''
                            });
                        }
                    }
                    // Check array warning is filled
                    sLine.WarningCount = sLine.Warning.length;
                    if (sLine.WarningCount > 0) {
                        // When Warning is not empty set buttons warning and
                        // delete visibity to TRUE
                        sLine.DisplayWarning = true;
                    }
                    // Add line on data set
                    data.push(sLine);
                }
            } else {
                data = aListServiceOrder;
                // Initialization one line with value empty and set Display
                // warning to FALSE and set button visibility to FALSE
                // Check Array is not empty add just one empty line
                sLine = {
                    HcsOrdExtDesc: "",
                    ParentId: "",
                    HcsOrdExtsyst: "",
                    HcsOrdExtId: "",
                    OrderId: "",
                    SortField: "",
                    Warning: [],
                    WarningCount: 0,
                    DisplayWarning: false,
                    EditableLine: true
                };

                // SO Description Add waning message :
                // ErrorMessage_Missing_filled_HcsOrdExtDesc=SO description
                // missing
                if (sLine.HcsOrdExtDesc === "") {
                    sLine.Warning.push({
                        code: '',
                        message: oBundle.getText("ErrorMessage_Missing_filled_HcsOrdExtDesc"),
                        severity: "E",
                        target: ''
                    });
                }

                // ParentId Add waning message :
                // ErrorMessage_Missing_filled_ParentId=Parent missing
                if (sLine.ParentId === "") {
                    sLine.Warning.push({
                        code: '',
                        message: oBundle.getText("ErrorMessage_Missing_filled_ParentId"),
                        severity: "E",
                        target: ''
                    });
                }

                // Ticket system Add waning message :
                // ErrorMessage_Missing_filled_HcsOrdExtsyst=Ticket system
                // missing
                if (sLine.HcsOrdExtsyst === "") {
                    sLine.Warning.push({
                        code: '',
                        message: oBundle.getText("ErrorMessage_Missing_filled_HcsOrdExtsyst"),
                        severity: "E",
                        target: ''
                    });
                }

                // Ticket ID Add waning message :
                // ErrorMessage_Missing_filled_HcsOrdExtId=Ticket ID missing
                if (sLine.HcsOrdExtId === "") {
                    sLine.Warning.push({
                        code: '',
                        message: oBundle.getText("ErrorMessage_Missing_filled_HcsOrdExtId"),
                        severity: "E",
                        target: ''
                    });
                } else {
                    if (sLine.HcsOrdExtId === "IPPM") {
                        sLine.Warning.push({
                            code: '',
                            message: oBundle.getText("ErrorMessage_Missing_filled_IPPM_HcsOrdExtId"),
                            severity: "E",
                            target: ''
                        });
                    }
                }
                // Check array warning is filled
                sLine.WarningCount = sLine.Warning.length;
                if (sLine.WarningCount > 0) {
                    // When Warning is not empty set buttons warning and delete
                    // visibity to TRUE
                    sLine.DisplayWarning = true;
                }
                // Add line on data set
                data.push(sLine);
            }
            // Bind the data to the Table
            this.getModel("ListServiceOrder").setData(data);
            // close dialog
            Utils.closeBusyDialog(this);
        },


        /**
         * Display messages in list format (dialog) sFromMethod => we get the
         * value from oResponse header if it's SUCCESS method, if it's from
         * ERROR method we get it from oData responseText else we get the table
         * directly
         */
        _handleMessages: function (oResponse) {
            try {
                var oModelErr = new JSONModel(),
                    aErrorConvert = [],
                    sType,
                    oMessages;

                oMessages = oResponse;
                oMessages.forEach(function (elt) {
                    switch (elt.severity) {
                        case "success":
                        case "S":
                            sType = "Success";
                            break;
                        case "warning":
                        case "W":
                            sType = "Warning";
                            break;
                        case "info":
                        case "I":
                            sType = "Information";
                            break;
                        default:
                            sType = "Error";
                    }
                    aErrorConvert.push({
                        type: sType,
                        description: elt.code,
                        title: elt.message
                    });
                });
                oModelErr.setData(aErrorConvert);
                var oMessageTemplate = new MessageItem({
                    type: "{type}",
                    title: "{title}",
                    description: "{description}",
                    subtitle: "{subtitle}",
                    counter: "{counter}"
                });
                var oMessageView = new MessageView({
                    showDetailsPageHeader: false,
                    itemSelect: function () {
                        oBackButton.setVisible(true);
                    },
                    items: {
                        path: "/",
                        template: oMessageTemplate
                    }
                });
                oMessageView.setModel(oModelErr);
                var oBackButton = new Button({
                    icon: IconPool.getIconURI("nav-back"),
                    visible: false,
                    press: function () {
                        oMessageView.navigateBack();
                        this.setVisible(false);
                    }
                });
                this.oDialog = new Dialog({
                    resizable: true,
                    content: oMessageView,
                    state: 'Error',
                    beginButton: new Button({
                        press: function () {
                            this.getParent().close();
                        },
                        text: "Close"
                    }),
                    customHeader: new Bar({
                        contentLeft: [oBackButton]
                    }),
                    contentHeight: "50%",
                    contentWidth: "50%",
                    verticalScrolling: false
                });
                this.oDialog.open();
            } catch (ex) {
                MessageToast.show(this.getResourceBundle().getText("ErrorMessage_Save"));
            }
        },

        /**
         * Button event to display messages in list format (dialog) sFromMethod =>
         * we get the value from oResponse header if it's SUCCESS method, if
         * it's from ERROR method we get it from oData responseText else we get
         * the table directly
         */
        onWarningButtonPressed: function (oEvent) {
            // Get the data from the Table view
            var sListServiceOrder = oEvent.getSource().getParent().getBindingContext('ListServiceOrder').getObject();
            // Start dialogue
            Utils.openBusyDialog(this);
            // check table is empty
            if (sListServiceOrder.Warning.length > 0) {
                // Display list in dialogueBox
                this._handleMessages(sListServiceOrder.Warning);
            }
            // close dialogue
            Utils.closeBusyDialog(this);
        },


        /**
         * Delete selected line button event
         */
        onRemoveLineButtonPressed: function (oEvent) {
            // get Message ressource
            var oBundle = this.getModel("i18n").getResourceBundle();
            // Catch path from event delete line
            var sPath = oEvent.getSource().getBindingContext('ListServiceOrder').getPath();
            // Get data from table view
            var aListServiceOrder = this.getView().getModel("ListServiceOrder").getData();
            // Catch array length before delete
            var oBefore_deleted = aListServiceOrder.length;
            // Replace / on the object oPath
            var oRow = sPath.replace('/', "");
            // convert to integer oRow
            var oRowInt = parseInt(oRow);
            // delete line by iD row
            aListServiceOrder.splice(oRowInt, 1);
            // Catch array length after delete
            var oAfter_deleted = aListServiceOrder.length;
            // check difference
            if (oAfter_deleted < oBefore_deleted) {
                // Update model and array view
                this.getModel("ListServiceOrder").setData([]);
                this.getModel("ListServiceOrder").setData(aListServiceOrder);
                // Display message sucess
                MessageToast.show(oBundle.getText("SuccessMessage_Delete_Line"));
            } else {
                this.getModel("ListServiceOrder").setData([]);
                this.getModel("ListServiceOrder").setData(aListServiceOrder);
                MessageToast.show(oBundle.getText("SuccessMessage_Delete_Line"));
            }

        },

        /**
         * Check input filed Event ENTER sfrontend
         */
        onCheckInputField: function (oEvent) {
            const aCheckValueHcsOrdExtId = ['IPPM', 'JIRA001', 'RALLY', 'TFS'];
            const aCheckValueHcsOrdExtIdM = ['JIRA001', 'RALLY', 'TFS'];
            var oRegExp = new RegExp("[0-9]{​2}​-[0-9]{​6}​-[0-9]{​2}​(-[0-9]{​2}​)*", "i");
            var oRegExp1 = new RegExp([0 - 9], "i");
            var oLength;
            var data = [];
            var oBundle = this.getModel("i18n").getResourceBundle();
            // get event source -> the link
            var link = oEvent.getSource();
            // get Row from table
            var row = link.getParent().getIndex();
            // get row context from the table
            var ListServiceOrder = this.getView().byId("MainTable");
            // get index object
            var oSelectedRow = ListServiceOrder.getContextByIndex(row);
            // get lie data
            var sListServiceOrder = this.getView().byId("MainTable").getModel("ListServiceOrder").getProperty(oSelectedRow.sPath);
            // Initialization array warning of line
            sListServiceOrder.Warning = [];
            // check field view input manually
            if (sListServiceOrder.HcsOrdExtDesc === "") {
                var myMessage = oBundle.getText("ErrorMessage_Missing_filled_HcsOrdExtDesc");
                sListServiceOrder.Warning.push({
                    code: '',
                    message: myMessage,
                    severity: "E",
                    target: ''
                });
            }
            if (sListServiceOrder.ParentId === "") {
                var myMessage = oBundle.getText("ErrorMessage_Missing_filled_ParentId");
                sListServiceOrder.Warning.push({
                    code: '',
                    message: myMessage,
                    severity: "E",
                    target: ''
                });
            } else {
                var oParentId = sListServiceOrder.ParentId.replaceAll("-", "");
                oLength = sListServiceOrder.ParentId.length;
                oParentId.replaceAll("-", "");
                oParentId.replaceAll(/\s/g, '');
                if ((oLength = oParentId.length) !== 10 && (oLength = oParentId.length) !== 12) {
                    sListServiceOrder.Warning.push({
                        code: '',
                        message: oBundle.getText("ErrorMessage_Format_ParentId"),
                        severity: "E",
                        target: ''
                    });
                }
            }
            if (sListServiceOrder.HcsOrdExtsyst === "") {
                var myMessage = oBundle.getText("ErrorMessage_Missing_filled_HcsOrdExtsyst");
                sListServiceOrder.Warning.push({
                    code: '',
                    message: myMessage,
                    severity: "E",
                    target: ''
                });
            } else {
                var oHcsOrdExtsyst = sListServiceOrder.HcsOrdExtsyst.toUpperCase();
                sListServiceOrder.HcsOrdExtsyst = oHcsOrdExtsyst;
                if (!aCheckValueHcsOrdExtId.includes(sListServiceOrder.HcsOrdExtsyst)) {
                    var myMessage = oBundle.getText("ErrorMessage_Value_filled_HcsOrdExtsyst");
                    sListServiceOrder.Warning.push({
                        code: '',
                        message: myMessage,
                        severity: "E",
                        target: ''
                    });
                }
            }
            if (sListServiceOrder.HcsOrdExtId === "") {
                if (aCheckValueHcsOrdExtIdM.includes(sListServiceOrder.HcsOrdExtsyst)) {
                    var myMessage = oBundle.getText("ErrorMessage_Missing_filled_HcsOrdExtId");
                    sListServiceOrder.Warning.push({
                        code: '',
                        message: myMessage,
                        severity: "E",
                        target: ''
                    });
                }
            } else {
                if (sListServiceOrder.HcsOrdExtsyst === "IPPM") {
                    var myMessage = oBundle.getText("ErrorMessage_Missing_filled_IPPM_HcsOrdExtId");
                    sListServiceOrder.Warning.push({
                        code: '',
                        message: myMessage,
                        severity: "E",
                        target: ''
                    });
                }
            }
            sListServiceOrder.WarningCount = sListServiceOrder.Warning.length;
            sListServiceOrder.DisplayWarning = sListServiceOrder.WarningCount > 0;
            this.getView().byId("MainTable").getModel("ListServiceOrder").setProperty(oSelectedRow.sPath, sListServiceOrder);
        },

        //*******************************************
        //*******************************************
        //*******************************************
        //				OBSELETE		
        //*******************************************
        //*******************************************
        //*******************************************
        //		/**
        //		 * Button open explorer and select file.
        //		 */
        //		onExcelUploadButtonPressed: function (oEvent) {
        //			// call funtion to Upload file on format CSV
        //			this._importCSV(oEvent.getParameter("files") && oEvent.getParameter("files")[0]);
        //		},
        //					
        //
        //		// Import CSV file function
        //		_importCSV: function (file) {
        //			// start dialogue
        //			const aCheckValueHcsOrdExtId = ['IPPM', 'JIRA001', 'RALLY', 'TFS'];
        //			const aCheckValueHcsOrdExtIdM = ['JIRA001', 'RALLY', 'TFS'];			
        //			var regexp1 = /^[0-9]{2}-[0-9]{5}-[0-9]{2}$/i;
        //			var regexp2 = /^[0-9]{2}-[0-9]{5}-[0-9]{2}-[0-9]{2}$/i;			
        //			var oBundle = this.getModel("i18n").getResourceBundle();		
        //			// Create a File Reader object
        //			var reader = new FileReader();
        //			// load filer and Read
        //			reader.onload = function(oEvent) {
        //				Utils.openBusyDialog(this);
        //				var strCSV = oEvent.target.result;				
        //				var arrCSV = strCSV.split("\n");
        //				var noOfLines = arrCSV.length;				
        //			    // To ignore the first row which is header
        //			    var hdrRow = arrCSV.splice(1, noOfLines);
        //			    hdrRow.pop();// delete last line
        //			    var data = [];
        //			    var aLine;
        //		    	var sLine = {};		    	
        //		  	    var oRegExp = new RegExp("[0-9]{​2}​-[0-9]{​6}​-[0-9]{​2}​(-[0-9]{​2}​)*", "i");
        //		  	    var oRegExp1 = new RegExp([0-9], "i");
        //		  	    var oLength;
        //		  	    // Check front End
        //			    hdrRow.forEach(function (oElt) {
        //			    	aLine = oElt.split(";");			    	
        //			    	if (aLine.length !== 5) {
        //			    		aLine = oElt.split(",");
        //			    	}
        //			    	sLine = {
        //						HcsOrdExtDesc : aLine[0],
        //						ParentId : aLine[1],
        //						HcsOrdExtsyst : aLine[2],
        //						HcsOrdExtId : aLine[3].replace('\r',""),
        //						OrderId : "",
        //						SortField: aLine[4],
        //						Warning: [],
        //						WarningCount : 0,
        //						DisplayWarning : false,
        //						EditableLine : false
        //			    	};
        //			    	if (sLine.HcsOrdExtDesc === "") {
        //			    		sLine.Warning.push({
        //			    			code : '',
        //			    			message : oBundle.getText("ErrorMessage_Missing_filled_HcsOrdExtDesc"),
        //			    			severity : "E",
        //			    			target : ''
        //			    		});
        //			    	}
        //			    	if (sLine.ParentId === "") {
        //			    		sLine.Warning.push({
        //			    			code : '',
        //			    			message : oBundle.getText("ErrorMessage_Missing_filled_ParentId"),
        //			    			severity : "E",
        //			    			target : ''
        //			    		});
        //			    	} else {
        //			    		var oParentId = sLine.ParentId.replaceAll("-", "");
        //			    		oParentId.replaceAll(/\s/g, '');
        //			    		oLength = sLine.ParentId.length;
        //			    		if ((oLength = oParentId.length) !== 10 && (oLength = oParentId.length) !== 12 ) {
        //			    			sLine.Warning.push({
        //			    				code : '',
        //			    				message : oBundle.getText("ErrorMessage_Format_ParentId"),
        //			    				severity : "E",
        //			    				target : ''
        //			    			});
        //			    		}
        //			    	}
        //			    	if (sLine.HcsOrdExtsyst === "") {
        //			    		sLine.Warning.push({
        //			    			code : '',
        //			    			message : oBundle.getText("ErrorMessage_Missing_filled_HcsOrdExtsyst"),
        //			    			severity : "E",
        //			    			target : ''
        //			    		});
        //			    	} else if (!aCheckValueHcsOrdExtId.includes(sLine.HcsOrdExtsyst)) {
        //			    		sLine.Warning.push({
        //			    			code : '',
        //			    			message : oBundle.getText("ErrorMessage_Value_filled_HcsOrdExtsyst") + " " + sLine.HcsOrdExtsyst,
        //			    			severity : "E",
        //			    			target : ''
        //			    		});
        //			    	}
        //			    	if (sLine.HcsOrdExtId === "" ) {				    		
        //			    		if  (aCheckValueHcsOrdExtIdM.includes(sLine.HcsOrdExtsyst)) {
        //			    			sLine.Warning.push({
        //			    				code : '',
        //			    				message : oBundle.getText("ErrorMessage_Missing_filled_HcsOrdExtId"),
        //			    				severity : "E",
        //			    				target : ''
        //			    			});
        //			    		}
        //			    	} else {
        //			    		if (sLine.HcsOrdExtsyst === "IPPM") {
        //			    			sLine.Warning.push({
        //			    				code : '',
        //			    				message : oBundle.getText("ErrorMessage_Missing_filled_IPPM_HcsOrdExtId"),
        //			    				severity : "E",
        //			    				target : ''
        //			    			});
        //			    		}
        //			    	}
        //			    	sLine.WarningCount = sLine.Warning.length;
        //			    	if (sLine.WarningCount > 0) {
        //			    		sLine.DisplayWarning = true;
        //			    	}
        //			    	data.push(sLine);
        //			    });		
        //			    // Check back end
        //			    this.getView().getModel("ListServiceOrder").setData(data);			
        //				var oDeep = {
        //					HcsOrdExtDesc: "",
        //					ParentId: "",
        //			    	HcsOrdExtsyst: "",
        //					HcsOrdExtId: "",
        //					OrderId : "",
        //					SortField: "",
        //					Test : 'X',
        //					ServiceOrderItemSet : []
        //				};
        //				data.forEach(function (oElt) {
        //					oDeep.Test = "X",	
        //					oDeep.ServiceOrderItemSet.push({
        //						HcsOrdExtDesc : oElt.HcsOrdExtDesc,
        //						ParentId : oElt.ParentId,
        //						HcsOrdExtsyst : oElt.HcsOrdExtsyst,
        //						HcsOrdExtId : oElt.HcsOrdExtId,
        //						SortField: oElt.SortField,
        //						OrderId : "",
        //						Test : ""
        //					});	
        //				});				
        //				var oParam = {
        //					success: (function(oData, oResponse) {
        //						Utils.closeBusyDialog(this);
        //						var oTableLine;
        //						var oTableLineError;
        //						var aTableLine= [];
        //						var aDetails = [];
        //						var ListServiceOrder = this.getView().byId("MainTable");
        //						var aListServiceOrder = this.getView().byId("MainTable").getModel("ListServiceOrder").getData()
        //						var hdrMessage = oResponse.headers["sap-message"];
        //						if (hdrMessage !== undefined) {
        //							var hdrMessageObject = JSON.parse(hdrMessage);
        //							aDetails = hdrMessageObject.details;
        //							if (oData.ServiceOrderItemSet.results.length > 0) {
        //								aTableLine = oData.ServiceOrderItemSet.results;
        //								// first line
        //								// get row context from the table
        //								var myMessage = hdrMessageObject.message;
        //								var aMessage = myMessage.split('/');
        //								var oRow = aMessage[0].replace(/\s+/g,"");
        //								var oRowInt = parseInt( oRow ) - 1 ;
        //								// aListServiceOrder[oRowInt].Warning = [];
        //								var oMessage = aMessage[1];
        //								if (hdrMessageObject.severity === 'error') {
        //									aListServiceOrder[oRowInt].Warning.push({
        //										code : '',
        //										message : aMessage[1],
        //										severity : "E",
        //										target : ''
        //									});										
        //									aListServiceOrder[oRowInt].WarningCount = aListServiceOrder[oRowInt].Warning.length;
        //									if (aListServiceOrder[oRowInt].WarningCount > 0) {
        //										aListServiceOrder[oRowInt].DisplayWarning = true;
        //									}								
        //								}
        //								aDetails.forEach(function (oEltError) {
        //									// Next line
        //									myMessage = oEltError.message;
        //									aMessage = myMessage.split('/');
        //									oRow = aMessage[0].replace(/\s+/g,"");
        //									oRowInt = parseInt( oRow ) - 1 ;
        //									if (oEltError.severity === 'error') {
        //										aListServiceOrder[oRowInt].Warning.push({
        //											code : '',
        //											message : aMessage[1],
        //											severity : "E",
        //											target : ''
        //										});
        //										aListServiceOrder[oRowInt].WarningCount = aListServiceOrder[oRowInt].Warning.length;
        //								    	if (aListServiceOrder[oRowInt].WarningCount > 0) {
        //								    		aListServiceOrder[oRowInt].DisplayWarning = true;
        //								    	}
        //									}
        //								});
        //							}
        //						}
        //						oData.ServiceOrderItemSet.results.forEach(function (oElt) {// findIndex
        //							oTableLine = aListServiceOrder.find(function (oServiceOrderCreated) {
        //								return oServiceOrderCreated.HcsOrdExtDesc === oElt.HcsOrdExtDesc
        //									&& oServiceOrderCreated.ParentId === oElt.ParentId
        //									&& oServiceOrderCreated.HcsOrdExtsyst === oElt.HcsOrdExtsyst
        //									&& oServiceOrderCreated.HcsOrdExtId === oElt.HcsOrdExtId;
        //							});
        //							if (oTableLine) {
        //								oTableLine.OrderId = oElt.OrderId;
        //								if (oTableLine.OrderId !== "") {
        //									oTableLine.Warning = [];
        //									oTableLine.WarningCount = 0;
        //									oTableLine.DisplayWarning = false;
        //								}
        //								oTableLine.EditableLine = false;
        //							}
        //						});
        //						this.getView().getModel("ListServiceOrder").setData(aListServiceOrder);
        //					}).bind(this),
        //					error: (function(oData,oResponse) {
        //						Utils.closeBusyDialog(this);
        //						var myMessage = JSON.parse(oData.responseText).error.message.value;
        //						var aMessage = myMessage.split('-');
        //						var oRow = aMessage[0].replace(/\s+/g,"");
        //						var oRowInt = parseInt( oRow ) - 1 ;
        //						var oMessage = aMessage[1];
        //						// get row context from the table
        //						var ListServiceOrder = this.getView().byId("MainTable");
        //						var oSelectedRow = ListServiceOrder.getContextByIndex(oRowInt);
        //						var sListServiceOrder = this.getView().byId("MainTable").getModel("ListServiceOrder").getProperty(oSelectedRow.sPath);
        //						sListServiceOrder.Warning = [];
        //						sListServiceOrder.Warning.push({
        //							code : '',
        //							message : oMessage,
        //							severity : "E",
        //							target : ''
        //						});
        //						sListServiceOrder.WarningCount = sListServiceOrder.Warning.length;
        //						if (sListServiceOrder.WarningCount > 0) {
        //							sListServiceOrder.DisplayWarning = true;
        //						}
        //						this.getView().getModel("ListServiceOrder").setData(aListServiceOrder);
        //					}).bind(this),
        //				};
        //				this.getView().getModel().create("/ServiceOrderHeaderSet", oDeep, oParam);
        //				Utils.closeBusyDialog(this);
        //			}.bind(this);
        //			if (file) {
        //				reader.readAsBinaryString(file);
        //			}			
        //		},

        /**
         * Author : Kaouass Aziz
         * Transform Xls to table
         */
        onUpload: function (oEvent) {
            var oFile = oEvent.getParameter("files") && oEvent.getParameter("files")[0];
            var aData = [];
            if (oFile && window.FileReader) {
                var oReader = new FileReader();
                oReader.onload = function (e) {
                    var oData = e.target.result;

                    var oWorkbook = XLSX.read(oData, {
                        type: 'binary'
                    });

                    //Transform Excel sheet to table
                    oWorkbook.SheetNames.forEach(function (sSheetName) {
                        aData = XLSX.utils.sheet_to_row_object_array(oWorkbook.Sheets[sSheetName]);
                    });

                    if (aData.length > 0) {
                        this._checkXls(aData);
                    }
                }.bind(this);

                //Error loading
                oReader.onerror = function (ex) {
                    var oBundle = this.getModel("i18n").getResourceBundle();
                    MessageToast.show(oBundle.getText("ErrorMessage_Load_Excel"));
                };

                oReader.readAsBinaryString(oFile);
            }
        },

        /**
         * Author : Kaouass Aziz
         * Check XLS entry
         */
        _checkXls: function (aExcelLines) {
            Utils.openBusyDialog(this);

            // start dialogue
            const aCheckValueHcsOrdExtId = ['IPPM', 'JIRA001', 'RALLY', 'TFS'];
            const aCheckValueHcsOrdExtIdM = ['JIRA001', 'RALLY', 'TFS'];
            const aColumnsName = ["Description", "Parent", "TicketSystem", "TicketID", "Grouping", "Deliverable"];

            var regexp1 = /^[0-9]{2}-[0-9]{5}-[0-9]{2}$/i;
            var regexp2 = /^[0-9]{2}-[0-9]{5}-[0-9]{2}-[0-9]{2}$/i;
            var oBundle = this.getModel("i18n").getResourceBundle();

            var sLine;
            var data = [];
            var oRegExp = new RegExp("[0-9]{​2}​-[0-9]{​6}​-[0-9]{​2}​(-[0-9]{​2}​)*", "i");
            var oRegExp1 = new RegExp([0 - 9], "i");
            var oLength;

            var aPropertiesNames = [];
            var bValidFile = true;

            //Verify file format before doing the checks
            aExcelLines.forEach(function (oElt) {
                aPropertiesNames = Object.keys(oElt);

                if (aPropertiesNames.length < 1) {
                    bValidFile = false;
                    return;
                }

                aPropertiesNames.forEach(function (sProp) {
                    if (!aColumnsName.includes(sProp)) {
                        bValidFile = false;
                        return;
                    }
                });
            });

            if (!bValidFile) {
                Utils.closeBusyDialog(this);
                MessageToast.show(oBundle.getText("ErrorMessage_Invalid_Column_Format"));
                return;
            }

            // Check front End
            aExcelLines.forEach(function (oElt) {
                sLine = {
                    HcsOrdExtDesc: (oElt.Description ? oElt.Description : ""),
                    ParentId: (oElt.Parent ? oElt.Parent : ""),
                    HcsOrdExtsyst: (oElt.TicketSystem ? oElt.TicketSystem : ""),
                    HcsOrdExtId: (oElt.TicketID ? oElt.TicketID : ""),
                    OrderId: "",
                    SortField: (oElt.Grouping ? oElt.Grouping : ""),
                    Deliverable: (oElt.Deliverable ? oElt.Deliverable : ""),
                    Warning: [],
                    WarningCount: 0,
                    DisplayWarning: false,
                    EditableLine: true
                };

                if (sLine.HcsOrdExtDesc === "") {
                    sLine.Warning.push({
                        code: '',
                        message: oBundle.getText("ErrorMessage_Missing_filled_HcsOrdExtDesc"),
                        severity: "E",
                        target: ''
                    });
                }
                if (sLine.ParentId === "") {
                    sLine.Warning.push({
                        code: '',
                        message: oBundle.getText("ErrorMessage_Missing_filled_ParentId"),
                        severity: "E",
                        target: ''
                    });
                } else {
                    var oParentId = sLine.ParentId.replaceAll("-", "");
                    oParentId.replaceAll(/\s/g, '');
                    oLength = sLine.ParentId.length;
                    if ((oLength = oParentId.length) !== 10 && (oLength = oParentId.length) !== 12) {
                        sLine.Warning.push({
                            code: '',
                            message: oBundle.getText("ErrorMessage_Format_ParentId"),
                            severity: "E",
                            target: ''
                        });
                    }
                }
                if (sLine.HcsOrdExtsyst === "") {
                    sLine.Warning.push({
                        code: '',
                        message: oBundle.getText("ErrorMessage_Missing_filled_HcsOrdExtsyst"),
                        severity: "E",
                        target: ''
                    });
                } else if (!aCheckValueHcsOrdExtId.includes(sLine.HcsOrdExtsyst)) {
                    sLine.Warning.push({
                        code: '',
                        message: oBundle.getText("ErrorMessage_Value_filled_HcsOrdExtsyst") + " " + sLine.HcsOrdExtsyst,
                        severity: "E",
                        target: ''
                    });
                }
                if (sLine.HcsOrdExtId === "") {
                    if (aCheckValueHcsOrdExtIdM.includes(sLine.HcsOrdExtsyst)) {
                        sLine.Warning.push({
                            code: '',
                            message: oBundle.getText("ErrorMessage_Missing_filled_HcsOrdExtId"),
                            severity: "E",
                            target: ''
                        });
                    }
                } else {
                    if (sLine.HcsOrdExtsyst === "IPPM") {
                        sLine.Warning.push({
                            code: '',
                            message: oBundle.getText("ErrorMessage_Missing_filled_IPPM_HcsOrdExtId"),
                            severity: "E",
                            target: ''
                        });
                    }
                }
                sLine.WarningCount = sLine.Warning.length;
                if (sLine.WarningCount > 0) {
                    sLine.DisplayWarning = true;
                }
                data.push(sLine);
            });
            // Check back end
            this.getView().getModel("ListServiceOrder").setData(data);
            var oDeep = {
                HcsOrdExtDesc: "",
                ParentId: "",
                HcsOrdExtsyst: "",
                HcsOrdExtId: "",
                OrderId: "",
                SortField: "",
                Test: 'X',
                ServiceOrderItemSet: []
            };
            data.forEach(function (oElt) {
                oDeep.Test = "X",
                    oDeep.ServiceOrderItemSet.push({
                        HcsOrdExtDesc: oElt.HcsOrdExtDesc,
                        ParentId: oElt.ParentId,
                        HcsOrdExtsyst: oElt.HcsOrdExtsyst,
                        HcsOrdExtId: oElt.HcsOrdExtId,
                        SortField: oElt.SortField,
                        OrderId: "",
                        Test: ""
                    });
            });
            var oParam = {
                success: (function (oData, oResponse) {
                    Utils.closeBusyDialog(this);
                    var oTableLine;
                    var oTableLineError;
                    var aTableLine = [];
                    var aDetails = [];
                    var ListServiceOrder = this.getView().byId("MainTable");
                    var aListServiceOrder = this.getView().byId("MainTable").getModel("ListServiceOrder").getData()
                    var hdrMessage = oResponse.headers["sap-message"];
                    if (hdrMessage !== undefined) {
                        var hdrMessageObject = JSON.parse(hdrMessage);
                        aDetails = hdrMessageObject.details;
                        if (oData.ServiceOrderItemSet.results.length > 0) {
                            aTableLine = oData.ServiceOrderItemSet.results;
                            // first line
                            // get row context from the table
                            var myMessage = hdrMessageObject.message;
                            var aMessage = myMessage.split('/');
                            var oRow = aMessage[0].replace(/\s+/g, "");
                            var oRowInt = parseInt(oRow) - 1;
                            // aListServiceOrder[oRowInt].Warning = [];
                            var oMessage = aMessage[1];
                            if (hdrMessageObject.severity === 'error') {
                                aListServiceOrder[oRowInt].Warning.push({
                                    code: '',
                                    message: aMessage[1],
                                    severity: "E",
                                    target: ''
                                });
                                aListServiceOrder[oRowInt].WarningCount = aListServiceOrder[oRowInt].Warning.length;
                                if (aListServiceOrder[oRowInt].WarningCount > 0) {
                                    aListServiceOrder[oRowInt].DisplayWarning = true;
                                }
                            }
                            aDetails.forEach(function (oEltError) {
                                // Next line
                                myMessage = oEltError.message;
                                aMessage = myMessage.split('/');
                                oRow = aMessage[0].replace(/\s+/g, "");
                                oRowInt = parseInt(oRow) - 1;
                                if (oEltError.severity === 'error') {
                                    aListServiceOrder[oRowInt].Warning.push({
                                        code: '',
                                        message: aMessage[1],
                                        severity: "E",
                                        target: ''
                                    });
                                    aListServiceOrder[oRowInt].WarningCount = aListServiceOrder[oRowInt].Warning.length;
                                    if (aListServiceOrder[oRowInt].WarningCount > 0) {
                                        aListServiceOrder[oRowInt].DisplayWarning = true;
                                    }
                                }
                            });
                        }
                    }
                    //					oData.ServiceOrderItemSet.results.forEach(function (oElt) {// findIndex
                    //						oTableLine = aListServiceOrder.find(function (oServiceOrderCreated) {
                    //							return oServiceOrderCreated.HcsOrdExtDesc === oElt.HcsOrdExtDesc
                    //								&& oServiceOrderCreated.ParentId === oElt.ParentId
                    //								&& oServiceOrderCreated.HcsOrdExtsyst === oElt.HcsOrdExtsyst
                    //								&& oServiceOrderCreated.HcsOrdExtId === oElt.HcsOrdExtId;
                    //						});
                    //						if (oTableLine) {
                    //							oTableLine.OrderId = oElt.OrderId;
                    //							if (oTableLine.OrderId !== "") {
                    //								oTableLine.Warning = [];
                    //								oTableLine.WarningCount = 0;
                    //								oTableLine.DisplayWarning = false;
                    //							}
                    //							oTableLine.EditableLine = false;
                    //						}
                    //					});

                    aListServiceOrder.forEach(function (oElt) {
                        var oOrderFound = oData.ServiceOrderItemSet.results.find(function (oBackendOrder) {
                            return oElt.HcsOrdExtDesc === oBackendOrder.HcsOrdExtDesc
                                && oElt.ParentId === oBackendOrder.ParentId
                                && oElt.HcsOrdExtsyst === oBackendOrder.HcsOrdExtsyst
                                && oElt.HcsOrdExtId === oBackendOrder.HcsOrdExtId;
                        });

                        if (oOrderFound) {
                            oElt.OrderId = oOrderFound.OrderId;
                            //oElt.WarningCount = oElt.Warning.length;
                            //oElt.EditableLine = true;
                            //if (oElt.WarningCount > 0) {
                            //	oElt.DisplayWarning = true;
                            //}
                        }
                    });

                    this.getView().getModel("ListServiceOrder").setData(aListServiceOrder);
                }).bind(this),
                error: (function (oData, oResponse) {
                    Utils.closeBusyDialog(this);
                    var myMessage = JSON.parse(oData.responseText).error.message.value;
                    var aMessage = myMessage.split('-');
                    var oRow = aMessage[0].replace(/\s+/g, "");
                    var oRowInt = parseInt(oRow) - 1;
                    var oMessage = aMessage[1];
                    // get row context from the table
                    var ListServiceOrder = this.getView().byId("MainTable");
                    var oSelectedRow = ListServiceOrder.getContextByIndex(oRowInt);
                    var sListServiceOrder = this.getView().byId("MainTable").getModel("ListServiceOrder").getProperty(oSelectedRow.sPath);
                    sListServiceOrder.Warning = [];
                    sListServiceOrder.Warning.push({
                        code: '',
                        message: oMessage,
                        severity: "E",
                        target: ''
                    });
                    sListServiceOrder.WarningCount = sListServiceOrder.Warning.length;
                    if (sListServiceOrder.WarningCount > 0) {
                        sListServiceOrder.DisplayWarning = true;
                    }
                    this.getView().getModel("ListServiceOrder").setData(aListServiceOrder);
                }).bind(this),
            };
            this.getView().getModel().create("/ServiceOrderHeaderSet", oDeep, oParam);
            Utils.closeBusyDialog(this);
        },

        /**
         * Control Check lines before Event ENTER posting
         */
        onControlCheckPressed: function (oEvent) {
            const aCheckValueHcsOrdExtId = ['IPPM', 'JIRA001', 'RALLY', 'TFS'];
            const aCheckValueHcsOrdExtIdM = ['JIRA001', 'RALLY', 'TFS'];
            var oBundle = this.getModel("i18n").getResourceBundle();
            var aListServiceOrder = this.getView().getModel("ListServiceOrder").getData();
            var oLength;

            Utils.openBusyDialog(this);
            if (aListServiceOrder.length === 0) {
                MessageToast.show(oBundle.getText("ErrorMessage_Nothing_Selected"));
                Utils.closeBusyDialog(this);
                return;
            }
            var oDeep = {
                HcsOrdExtDesc: "",
                ParentId: "",
                HcsOrdExtsyst: "",
                HcsOrdExtId: "",
                OrderId: "",
                SortField: "",
                Deliverable: "",
                Test: "X",
                ServiceOrderItemSet: []
            };
            aListServiceOrder.forEach(function (oElt) {
                //Aziz Kaouass - No need to recheck if already posted
                if (oElt.OrderId && !oElt.EditableLine) {
                    oElt.Warning = [];
                    oElt.DisplayWarning = false;
                    //But we still send them to back end to let the code retrieve the right error line
                    oDeep.Test = "X";
                    oDeep.ServiceOrderItemSet.push({
                        HcsOrdExtDesc: oElt.HcsOrdExtDesc,
                        ParentId: oElt.ParentId,
                        HcsOrdExtsyst: oElt.HcsOrdExtsyst,
                        HcsOrdExtId: oElt.HcsOrdExtId,
                        SortField: oElt.SortField,
                        Deliverable: oElt.Deliverable,
                        OrderId: oElt.OrderId,
                        Test: ""
                    });
                    return;
                }
                if (oElt.Warning.length > 0) {
                    oElt.Warning = [];
                }
                if (oElt.OrderId !== 0) {
                    oElt.OrderId = "";
                }
                // check frontend
                if (oElt.HcsOrdExtDesc === "") {
                    oElt.Warning.push({
                        code: '',
                        message: oBundle.getText("ErrorMessage_Missing_filled_HcsOrdExtDesc"),
                        severity: "E",
                        target: ''
                    });
                }
                if (oElt.ParentId === "") {
                    oElt.Warning.push({
                        code: '',
                        message: oBundle.getText("ErrorMessage_Missing_filled_ParentId"),
                        severity: "E",
                        target: ''
                    });
                } else {
                    var oParentId = oElt.ParentId.replaceAll("-", "");
                    oParentId.replaceAll(/\s/g, '');
                    oLength = oElt.ParentId.length;
                    if ((oLength = oParentId.length) !== 10 && (oLength = oParentId.length) !== 12) {
                        oElt.Warning.push({
                            code: '',
                            message: oBundle.getText("ErrorMessage_Format_ParentId"),
                            severity: "E",
                            target: ''
                        });
                    }
                }
                if (oElt.HcsOrdExtsyst === "") {
                    oElt.Warning.push({
                        code: '',
                        message: oBundle.getText("ErrorMessage_Missing_filled_HcsOrdExtsyst"),
                        severity: "E",
                        target: ''
                    });
                } else if (!aCheckValueHcsOrdExtId.includes(oElt.HcsOrdExtsyst)) {
                    oElt.Warning.push({
                        code: '',
                        message: oBundle.getText("ErrorMessage_Value_filled_HcsOrdExtsyst") + " " + oElt.HcsOrdExtsyst,
                        severity: "E",
                        target: ''
                    });
                }
                if (oElt.HcsOrdExtId === "") {
                    if (oElt.HcsOrdExtsyst === "") {
                        oElt.Warning.push({
                            code: '',
                            message: oBundle.getText("ErrorMessage_Missing_filled_HcsOrdExtId"),
                            severity: "E",
                            target: ''
                        });
                    }
                    if (aCheckValueHcsOrdExtIdM.includes(oElt.HcsOrdExtsyst)) {
                        oElt.Warning.push({
                            code: '',
                            message: oBundle.getText("ErrorMessage_Missing_filled_HcsOrdExtId"),
                            severity: "E",
                            target: ''
                        });
                    }
                } else {
                    if (oElt.HcsOrdExtsyst === "IPPM") {
                        oElt.Warning.push({
                            code: '',
                            message: oBundle.getText("ErrorMessage_Missing_filled_IPPM_HcsOrdExtId"),
                            severity: "E",
                            target: ''
                        });
                    }
                }
                oElt.WarningCount = oElt.Warning.length;
                //Aziz Kaouass - Change this to avoid error
                //			    	if (oElt.WarningCount > 0) {
                //			    		oElt.DisplayWarning = true;
                //			    	}
                oElt.DisplayWarning = (oElt.WarningCount > 0);

                oDeep.Test = "X";
                oDeep.ServiceOrderItemSet.push({
                    HcsOrdExtDesc: oElt.HcsOrdExtDesc,
                    ParentId: oElt.ParentId,
                    HcsOrdExtsyst: oElt.HcsOrdExtsyst,
                    HcsOrdExtId: oElt.HcsOrdExtId,
                    SortField: oElt.SortField,
                    Deliverable: oElt.Deliverable,
                    OrderId: oElt.OrderId,
                    Test: ""
                });
            });
            var oParam = {
                success: (function (oData, oResponse) {
                    var oTableLine;
                    var oTableLineError;
                    var aTableLine = [];
                    var aDetails = [];
                    var hdrMessage = oResponse.headers["sap-message"];
                    if (hdrMessage !== undefined) {
                        var hdrMessageObject = JSON.parse(hdrMessage);
                        aDetails = hdrMessageObject.details;
                        if (oData.ServiceOrderItemSet.results.length > 0) {
                            aTableLine = oData.ServiceOrderItemSet.results;
                            // first line
                            // get row context from the table
                            var myMessage = hdrMessageObject.message;
                            var aMessage = myMessage.split('/');
                            var oRow = aMessage[0].replace(/\s+/g, "");
                            var oRowInt = parseInt(oRow) - 1;
                            // aListServiceOrder[oRowInt].Warning = [];
                            var oMessage = aMessage[1];
                            if (hdrMessageObject.severity === 'error') {
                                //Aziz Kaouass - No need to add error on posted line
                                if (!aListServiceOrder[oRowInt].OrderId && aListServiceOrder[oRowInt].EditableLine) {
                                    aListServiceOrder[oRowInt].Warning.push({
                                        code: '',
                                        message: aMessage[1],
                                        severity: "E",
                                        target: ''
                                    });
                                    aListServiceOrder[oRowInt].WarningCount = aListServiceOrder[oRowInt].Warning.length;
                                    if (aListServiceOrder[oRowInt].WarningCount > 0) {
                                        aListServiceOrder[oRowInt].DisplayWarning = true;
                                    }
                                }
                            }
                            aDetails.forEach(function (oEltError) {
                                // Next line
                                myMessage = oEltError.message;
                                aMessage = myMessage.split('/');
                                oRow = aMessage[0].replace(/\s+/g, "");
                                oRowInt = parseInt(oRow) - 1;
                                if (oEltError.severity === 'error') {
                                    //Aziz Kaouass - No need to add error on posted line
                                    if (!aListServiceOrder[oRowInt].OrderId && aListServiceOrder[oRowInt].EditableLine) {
                                        aListServiceOrder[oRowInt].Warning.push({
                                            code: '',
                                            message: aMessage[1],
                                            severity: "E",
                                            target: ''
                                        });
                                        aListServiceOrder[oRowInt].WarningCount = aListServiceOrder[oRowInt].Warning.length;
                                        if (aListServiceOrder[oRowInt].WarningCount > 0) {
                                            aListServiceOrder[oRowInt].DisplayWarning = true;
                                        }
                                    }
                                }
                            });
                        }
                    }
                    //Aziz Kaouass - Take the problem in other side in case we have multiple line for the same order id
                    //						oData.ServiceOrderItemSet.results.forEach(function (oElt) {// findIndex
                    //							oTableLine = aListServiceOrder.find(function (oServiceOrderCreated) {
                    //								return oServiceOrderCreated.HcsOrdExtDesc === oElt.HcsOrdExtDesc
                    //									&& oServiceOrderCreated.ParentId === oElt.ParentId
                    //									&& oServiceOrderCreated.HcsOrdExtsyst === oElt.HcsOrdExtsyst
                    //									&& oServiceOrderCreated.HcsOrdExtId === oElt.HcsOrdExtId;
                    //							});
                    //							if (oTableLine) {
                    //								oTableLine.OrderId = oElt.OrderId;	
                    //								oTableLine.WarningCount = oTableLine.Warning.length;
                    //								oTableLine.EditableLine = false;
                    //								if (oTableLine.WarningCount > 0) {
                    //									oTableLine.DisplayWarning = true;
                    //								}
                    //							}
                    //						});

                    aListServiceOrder.forEach(function (oElt) {
                        //Aziz Kaouass - No need to add error on posted line
                        if (oElt.OrderId && !oElt.EditableLine) {
                            return;
                        }
                        var oOrderFound = oData.ServiceOrderItemSet.results.find(function (oBackendOrder) {
                            return oElt.HcsOrdExtDesc === oBackendOrder.HcsOrdExtDesc
                                && oElt.ParentId === oBackendOrder.ParentId
                                && oElt.HcsOrdExtsyst === oBackendOrder.HcsOrdExtsyst
                                && oElt.HcsOrdExtId === oBackendOrder.HcsOrdExtId;
                        });

                        if (oOrderFound) {
                            oElt.OrderId = oOrderFound.OrderId;
                            //								oElt.WarningCount = oElt.Warning.length;
                            //								oElt.EditableLine = true;
                            //								if (oElt.WarningCount > 0) {
                            //									oElt.DisplayWarning = true;
                            //								}
                        }
                    });

                    // Clean up table view line blank
                    aListServiceOrder = aListServiceOrder.filter(function (oElt) {
                        return (oElt.Warning.length !== 4 && (oElt.HcsOrdExtDesc !== "" || oElt.ParentId !== "" || oElt.HcsOrdExtsyst !== "" || oElt.HcsOrdExtId !== ""));
                    });
                    this.getView().getModel("ListServiceOrder").setData(aListServiceOrder);
                    Utils.closeBusyDialog(this);
                }).bind(this),
                error: (function (oData, oResponse) {
                    var myMessage = JSON.parse(oData.responseText).error.message.value;
                    var aMessage = myMessage.split('-');
                    var oRow = aMessage[0].replace(/\s+/g, "");
                    var oRowInt = parseInt(oRow) - 1;
                    // oRow = '/' + oRow;
                    var oMessage = aMessage[1];
                    // get row context from the table
                    var ListServiceOrder = this.getView().byId("MainTable");
                    var oSelectedRow = ListServiceOrder.getContextByIndex(oRowInt);
                    var sListServiceOrder = this.getView().byId("MainTable").getModel("ListServiceOrder").getProperty(oSelectedRow.sPath);
                    sListServiceOrder.Warning = [];
                    sListServiceOrder.Warning.push({
                        code: '',
                        message: oMessage,
                        severity: "E",
                        target: ''
                    });
                    sListServiceOrder.WarningCount = sListServiceOrder.Warning.length;
                    if (sListServiceOrder.WarningCount > 0) {
                        sListServiceOrder.DisplayWarning = true;
                    }
                    this.getView().getModel("ListServiceOrder").setData(aListServiceOrder);
                    Utils.closeBusyDialog(this);
                }).bind(this),
            };
            this.getView().getModel().create("/ServiceOrderHeaderSet", oDeep, oParam);
        },

        /**
         * Download Excel template
         */
        onExcelTemplatePressed: function () {
            var aData = [];
            var aCols = this._createColumnListForExcel("TemplateTable");
            var oSheet = new Spreadsheet({ workbook: { columns: aCols }, dataSource: aData, fileName: "SO Mass Creation.xlsx" });
            oSheet.build().then().finally(oSheet.destroy);
        },

        /**
         * Download to Excel
         */
        onExcelDownloadPressed: function () {
            var aData = this.getModel("ListServiceOrder").oData;
            if (aData.length > 0) {
                var aCols = this._createColumnListForExcel("MainTable");
                var oSheet = new Spreadsheet({ workbook: { columns: aCols }, dataSource: aData });
                oSheet.build().then().finally(oSheet.destroy);
            } else {
                //Aziz Kaouass - Add an error message if the table is empty
                var oBundle = this.getModel("i18n").getResourceBundle();
                MessageToast.show(oBundle.getText("ErrorMessage_Empty_Table_Excel"));
            }
        },

        /**
         * Determine all the column for the Excel export
         */
        _createColumnListForExcel: function (sTable) {
            var oMapping = (this.getView().byId(sTable).getColumns() || []).map(function (oItem) {
                var oDataMap = {
                    label: oItem.getLabel().getText(),
                    // Sort property is easier to get here and always have
                    // the same field name as the binding
                    property: oItem.getSortProperty()
                };
                // Avoid data without column header (like the one for
                // edit/delete button)
                if (oDataMap.label) {
                    return oDataMap;
                }
            });
            return oMapping;
        },

        /**
         * Validation button
         */
        onSendPosting: function () {
            var oBundle = this.getModel("i18n").getResourceBundle();
            var aListServiceOrder = this.getView().getModel("ListServiceOrder").getData();
            var bError = false;
            Utils.openBusyDialog(this);
            if (aListServiceOrder.length === 0) {
                MessageToast.show(oBundle.getText("ErrorMessage_Nothing_Selected"));
                Utils.closeBusyDialog(this);
                return;
            }
            var oDeep = {
                HcsOrdExtDesc: "",
                ParentId: "",
                HcsOrdExtsyst: "",
                HcsOrdExtId: "",
                OrderId: "",
                Test: "",
                SortField: "",
                Deliverable: "",
                ServiceOrderItemSet: []
            };
            aListServiceOrder.forEach(function (oElt) {
                if (oElt.Warning.length > 0) {
                    bError = true;
                }
                oDeep.Test = '',
                    oDeep.ServiceOrderItemSet.push({
                        HcsOrdExtDesc: oElt.HcsOrdExtDesc,
                        ParentId: oElt.ParentId,
                        HcsOrdExtsyst: oElt.HcsOrdExtsyst,
                        HcsOrdExtId: oElt.HcsOrdExtId,
                        SortField: oElt.SortField,
                        Deliverable: oElt.Deliverable,
                        OrderId: oElt.OrderId,
                        Test: ''
                    });
            });
            var oParam = {
                success: (function (oData, oResponse) {
                    var oTableLine;
                    var oTableLineError;
                    var aTableLine = [];
                    var aDetails = [];
                    var ListServiceOrder = this.getView().byId("MainTable");
                    var aListServiceOrder = this.getView().byId("MainTable").getModel("ListServiceOrder").getData();
                    var hdrMessage = oResponse.headers["sap-message"];
                    if (hdrMessage !== undefined) {
                        var hdrMessageObject = JSON.parse(hdrMessage);
                        aDetails = hdrMessageObject.details;
                        if (oData.ServiceOrderItemSet.results.length > 0) {
                            aTableLine = oData.ServiceOrderItemSet.results;
                            // first line
                            // get row context from the table
                            var myMessage = hdrMessageObject.message;
                            var aMessage = myMessage.split('/');
                            var oRow = aMessage[0].replace(/\s+/g, "");
                            var oRowInt = parseInt(oRow) - 1;
                            aListServiceOrder[oRowInt].Warning = [];
                            var oMessage = aMessage[1];
                            if (hdrMessageObject.severity === 'error') {
                                aListServiceOrder[oRowInt].Warning.push({
                                    code: '',
                                    message: aMessage[1],
                                    severity: "E",
                                    target: ''
                                });
                                aListServiceOrder[oRowInt].WarningCount = aListServiceOrder[oRowInt].Warning.length;
                                if (aListServiceOrder[oRowInt].WarningCount > 0) {
                                    aListServiceOrder[oRowInt].DisplayWarning = true;
                                }
                            }
                            aDetails.forEach(function (oEltError) {
                                // Next line
                                myMessage = oEltError.message;
                                aMessage = myMessage.split('/');
                                oRow = aMessage[0].replace(/\s+/g, "");
                                oRowInt = parseInt(oRow) - 1;
                                if (oEltError.severity === 'error') {
                                    aListServiceOrder[oRowInt].Warning.push({
                                        code: '',
                                        message: aMessage[1],
                                        severity: "E",
                                        target: ''
                                    });
                                    aListServiceOrder[oRowInt].WarningCount = aListServiceOrder[oRowInt].Warning.length;
                                    if (aListServiceOrder[oRowInt].WarningCount > 0) {
                                        aListServiceOrder[oRowInt].DisplayWarning = true;
                                    }
                                }
                            });
                        }
                    }
                    oData.ServiceOrderItemSet.results.forEach(function (oElt) {// findIndex
                        oTableLine = aListServiceOrder.find(function (oServiceOrderCreated) {
                            return oServiceOrderCreated.HcsOrdExtDesc === oElt.HcsOrdExtDesc
                                && oServiceOrderCreated.ParentId === oElt.ParentId
                                && oServiceOrderCreated.HcsOrdExtsyst === oElt.HcsOrdExtsyst
                                && oServiceOrderCreated.HcsOrdExtId === oElt.HcsOrdExtId;
                        });
                        if (oTableLine) {
                            oTableLine.OrderId = oElt.OrderId;
                            oTableLine.EditableLine = false;
                        }
                    });
                    this.getView().getModel("ListServiceOrder").setData(aListServiceOrder);
                    Utils.closeBusyDialog(this);
                }).bind(this),
                error: (function (oData, oResponse) {
                    var myMessage = JSON.parse(oData.responseText).error.message.value;
                    var aMessage = myMessage.split('-');
                    var oRow = aMessage[0].replace(/\s+/g, "");
                    var oRowInt = parseInt(oRow) - 1;
                    var oMessage = aMessage[1];
                    // get row context from the table
                    var ListServiceOrder = this.getView().byId("MainTable");
                    var oSelectedRow = ListServiceOrder.getContextByIndex(oRowInt);
                    var sListServiceOrder = this.getView().byId("MainTable").getModel("ListServiceOrder").getProperty(oSelectedRow.sPath);
                    sListServiceOrder.Warning = [];
                    sListServiceOrder.Warning.push({
                        code: '',
                        message: oMessage,
                        severity: "E",
                        target: ''
                    });
                    sListServiceOrder.WarningCount = sListServiceOrder.Warning.length;
                    if (sListServiceOrder.WarningCount > 0) {
                        sListServiceOrder.DisplayWarning = true;
                    }
                    this.getView().getModel("ListServiceOrder").setData(aListServiceOrder);
                    Utils.closeBusyDialog(this);
                }).bind(this),
            };
            if (bError) {
                // get Message ressource
                var oBundle = this.getModel("i18n").getResourceBundle();
                MessageToast.show(oBundle.getText("ErrorMessage_when_posting"));
                Utils.closeBusyDialog(this);
            } else {
                this.getView().getModel().create("/ServiceOrderHeaderSet", oDeep, oParam);
            }
        },


        /**
         * Initialize the detail page (mandatory for TransactionHandler)
         */
        initIPPMProperties: function () {
            this.oIPPMProperties = { routeName: "main" };
        },

        /***********************************************************************
         * Search *
         **********************************************************************/

        /**
         * Load data from the filters
         */
        onSearch: function () {
            Utils.openBusyDialog(this);
            var aFilters = this._getAllFilters();
            aFilters.push(new Filter({ path: "Status", operator: FilterOperator.EQ, value1: '10' }));
            if (aFilters.length > 0) {
                this.getModel().read("/ProposalItemSet", {
                    filters: aFilters,
                    success: function (oData) {
                        this.getModel("proposalData").setData(oData.results);
                        Utils.closeBusyDialog(this);
                    }.bind(this),
                    error: function (oData) {
                        Utils.closeBusyDialog(this);
                    }.bind(this)
                });
            } else {
                var oBundle = this.getModel("i18n").getResourceBundle();
                MessageToast.show(oBundle.getText("ErrorMessage_No_Filter"));
                Utils.closeBusyDialog(this);
            }
        },

        /**
         * Transform filters selection into Filters object
         */
        _getAllFilters: function () {
            var aFilters = this.byId("filterBar").getAllFilterItems().reduce(function (aResult, oItem) {
                var oControl = oItem.getControl(), sPath, i;

                switch (oControl.getMetadata().getName()) {
                    case "sap.m.DatePicker":
                        var oDateValue = oItem.getControl().getDateValue();

                        if (oDateValue) {
                            if (oItem.getName() === "Period") {
                                aResult.push(new Filter({
                                    path: "FiscalMonth",
                                    operator: FilterOperator.EQ,
                                    value1: (oDateValue.getMonth() + 1)
                                }));

                                aResult.push(new Filter({
                                    path: "FiscalYear",
                                    operator: FilterOperator.EQ,
                                    value1: oDateValue.getFullYear()
                                }));
                            } else {
                                aResult.push(new Filter({ path: oItem.getName(), operator: FilterOperator.EQ, value1: oDateValue }));
                            }
                        }
                        break;
                    case "sap.m.MultiInput":
                        var aTokens = oControl.getTokens();

                        if (aTokens.length > 0) {
                            for (i = 0; i < aTokens.length; i++) {
                                aResult.push(new Filter({ path: oItem.getName(), operator: FilterOperator.EQ, value1: aTokens[i].getProperty("key") }));
                            }
                        }
                        break;
                    case "sap.m.MultiComboBox":
                        var aKeys = oControl.getSelectedItems();

                        if (aKeys.length > 0) {
                            for (i = 0; i < aKeys.length; i++) {
                                aResult.push(new Filter({ path: oItem.getName(), operator: FilterOperator.EQ, value1: aKeys[i].getKey() }));
                            }
                        }
                        break;
                    default:
                        if (oItem.getControl().getValue() && oItem.getControl().getValue() !== "") {
                            aResult.push(new Filter({ path: oItem.getName(), operator: FilterOperator.EQ, value1: oItem.getControl().getValue() }));
                        }
                        break;
                }
                return aResult;
            }, []);

            return aFilters;
        },

        /***********************************************************************
         * Value helpers *
         **********************************************************************/
        /**
         * Create the filter for value help search
         */
        _createValueHelpFilter: function (sField, sFilterString) {
            var aFilters = [new Filter({ path: "FieldName", operator: FilterOperator.EQ, value1: sField })];

            if (sFilterString) {
                aFilters.push(new Filter({ path: "FilterString", operator: FilterOperator.EQ, value1: sFilterString }));
            }

            return aFilters;
        },

        /**
         * Call the required search help fragment
         */
        _callFragmentHelp: function (sFragment, sField, sInputValue) {
            var oView = this.getView();

            if (!this._pValueHelpDialog) {
                this._pValueHelpDialog = SAPFragment.load({
                    id: oView.getId(),
                    name: sFragment,
                    controller: this
                }).then(function (oValueHelpDialog) {
                    oView.addDependent(oValueHelpDialog);
                    return oValueHelpDialog;
                });
            }

            this._pValueHelpDialog.then(function (oValueHelpDialog) {
                // All others Search Help
                oValueHelpDialog.getBinding("items").filter(this._createValueHelpFilter(sField));
                oValueHelpDialog.open(sInputValue);
            }.bind(this));
        },

        /**
         * Close a tree filter
         */
        onVhCloseTree: function (evt) {
            var oPopup = evt.getSource().getParent();
            oPopup.close();
            oPopup.destroy();
            this._pValueHelpDialog = null;
        },

        /**
         * Open fragment for vendors search help
         */
        onVhVendor: function (oEvent) {
            this._callFragmentHelp(this.sVendorsHelpFragment, "VENDORS", oEvent.getSource().getValue());
        },

        /**
         * Search vendor search help
         */
        _onVhSearchVendors: function (evt) {
            // Attach once to avoid multiple triggers as we can reopen the same
            // popup
            var oBinding = evt.getSource().getBinding("items");
            oBinding.attachEventOnce("change", function (e) {
                this._refocusSearch();
            }.bind(this));
            evt.getSource().getBinding("items").filter(this._createValueHelpFilter("VENDORS", evt.getParameter("value")));
        },

        /**
         * Close vendor search help
         */
        _onVhCloseVendors: function (evt) {
            this._closeFragmentHelpMultiInput("fcVendorId", evt.getParameter("selectedItems"));
        },

        /**
         * Put all values in the input when we close the fragment help
         */
        _closeFragmentHelpMultiInput: function (sInputName, aSelectedItems) {
            var oMultiInput = this.byId(sInputName);

            if (aSelectedItems && aSelectedItems.length > 0) {
                aSelectedItems.forEach(function (oItem) {
                    oMultiInput.addToken(new Token({
                        text: oItem.getTitle(),
                        key: oItem.getDescription()
                    }));
                });
            }
            this._pValueHelpDialog.destroy();
            this._pValueHelpDialog = null;
        },

        /**
         * Try to find the last search bar on the popup to focus it after few
         * second (after search)
         */
        _refocusSearch: function () {
            var oView = this.getView();
            var iLast = oView.getDependents().length - 1;
            var oSFDOM = oView.getDependents()[iLast].$().find('.sapMSF');

            if (oSFDOM) {
                var oID = oSFDOM[0].id;
                var oSearchField = sap.ui.getCore().byId(oID);

                if (oSearchField) {
                    jQuery.sap.delayedCall(300, null, function () {
                        oSearchField.focus();
                    });
                }
            }
        },

        onVhDeliverable: function (oEvent) {
            var oView = this.getView(),
                sTerm = oEvent.getSource().getValue(),
                sParentId = oEvent.getSource().getBindingContext("ListServiceOrder").getProperty("ParentId"),
                sPath = oEvent.getSource().getBindingContext('ListServiceOrder').getPath(),
                oRow = sPath.replace('/', ""),
                oRowInt = parseInt(oRow),
                sItemId = "";
            this.iSelectedLine = oRowInt;

            if (sParentId) {
                var aWords = sParentId.split("-");
                sItemId = aWords[0] + "-" + aWords[1];
            }

            var aFilters = this._deliverableSearchFilter(sItemId, sTerm);

            if (!this._pDeliverableValueHelpDialog) {
                this._pDeliverableValueHelpDialog = SAPFragment.load({
                    id: oView.getId(),
                    name: this.sDeliverableHelpFragment,
                    controller: this
                }).then(function (oValueHelpDialog) {
                    oView.addDependent(oValueHelpDialog);
                    return oValueHelpDialog;
                });
            }

            this._pDeliverableValueHelpDialog.then(function (oValueHelpDialog) {
                oValueHelpDialog.getBinding("items").filter(aFilters);
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setProperty("/selectedItemId", sItemId);
                oValueHelpDialog.setModel(oModel);

                oValueHelpDialog.open(sTerm);
            }.bind(this));

        },
        _deliverableSearchFilter: function (sItemId, sTerm) {
            var aFilters = [],
                aAndFilters = [];
            if (sTerm) {
                aFilters.push(new Filter("SearchString", FilterOperator.Contains, sTerm));
            }
            aFilters.push(new Filter("Item", FilterOperator.EQ, sItemId));
            aFilters.push(new Filter("SystemStatus", FilterOperator.EQ, 'CRTD'));
            aAndFilters.push(new Filter(aFilters, true));
            if (aAndFilters.length > 0) aFilters = aAndFilters;

            return aFilters;
        },

        _onVhSearchDeliverable: function (oEvent) {
            var sTerm = oEvent.getParameter("value"),
                sItemId = oEvent.getSource().getModel().getProperty("/selectedItemId"),
                aFilters = this._deliverableSearchFilter(sItemId, sTerm);
            oEvent.getParameter("itemsBinding").filter(aFilters);
        },

        _onVhCloseDeliverable: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            var aListServiceOrder = this.getModel("ListServiceOrder").getData();
            if (!aListServiceOrder[this.iSelectedLine]) {
                return;
            }
            if (oSelectedItem) {
                aListServiceOrder[this.iSelectedLine].Deliverable = oSelectedItem.getTitle();
                this.getModel("ListServiceOrder").setData(aListServiceOrder);
            }
            this._pValueHelpDialog = null;
        }
    });
});

function PfTree(that, TreeTableUtils) {

    this.appId = "com.amadeus.fiori.iaos.creation.ycrc.fragments.";
    this.fragments = { portfolioTreeTable: "PortfolioTreeTable" };
    this.fields = { treename: "pfTree" };
    this.models = { ppm: "ppm", sParam: "sParam", selection: "selection", so: "so" };
    this.entitySets = { portfolioObjects: "/PortfolioObjects" };
    this.pfType0 = { bucket: "BUCKET", item: "ITEM", phase: "PHASE", order: "SERVICEORDER" };
    this.pfType = { item: "IT", phase: "PH", order: "SO" };
    this.pfHierLevels = { 1: "buckets1", 2: "buckets2", 3: "buckets3", 4: "buckets4", 5: "buckets5", 6: "items", 7: "phases", 8: "orders" };
    this.oTable = sap.ui.getCore().byId(this.fields.treename);
    this.treeFieldNames = { id: "id", parentId: "parentId" };
    this.pfTables = {};


    this.initVariables = function initVariables() {
        this.theTree = null;
        this.selectedObject = { Id: "", Type: "", ParentId: "" };
        this.pfTypeMax = "";

    };
    this.init = function init() {
        this.initVariables();
        this.refreshTrees();
    };
    this.refreshTrees = function refreshTrees() {
        // Read Buckets, Items, Phases, Orders
        that.getView().getModel(this.models.so).callFunction("/BipoGet", {
            method: "GET",
            error: jQuery.proxy(function (oData) {
                sap.m.MessageBox.error("Error during Portfolio read");
            }, this),
            success: jQuery.proxy(function (oData) {
                console.log("BipoGet executed");
                this.pfTables = {
                    buckets1: JSON.parse(oData.Buckets1),
                    buckets2: JSON.parse(oData.Buckets2),
                    buckets3: JSON.parse(oData.Buckets3),
                    buckets4: JSON.parse(oData.Buckets4),
                    buckets5: JSON.parse(oData.Buckets5),
                    items: JSON.parse(oData.Items),
                    phases: JSON.parse(oData.Phases),
                    orders: JSON.parse(oData.Orders)
                };
                this.pfTables.buckets1[0].isLastLevel = "";
                this.pfTables.buckets2.push(this.pfTables.buckets1[0]);

                // add 'type' to retrieved collections
                this.propertyAdd(this.pfTables.buckets1, "type", this.pfType0.bucket);
                this.propertyAdd(this.pfTables.buckets2, "type", this.pfType0.bucket);
                this.propertyAdd(this.pfTables.buckets3, "type", this.pfType0.bucket);
                this.propertyAdd(this.pfTables.buckets4, "type", this.pfType0.bucket);
                this.propertyAdd(this.pfTables.buckets5, "type", this.pfType0.bucket);
                this.propertyAdd(this.pfTables.items, "type", this.pfType0.item);
                this.propertyAdd(this.pfTables.phases, "type", this.pfType0.phase);
                this.propertyAdd(this.pfTables.orders, "type", this.pfType0.order);

                // add 'level' to retrieved collections
                this.propertyAdd(this.pfTables.buckets1, "level", 1);
                this.propertyAdd(this.pfTables.buckets2, "level", 2);
                this.propertyAdd(this.pfTables.buckets3, "level", 3);
                this.propertyAdd(this.pfTables.buckets4, "level", 4);
                this.propertyAdd(this.pfTables.buckets5, "level", 5);
                this.propertyAdd(this.pfTables.items, "level", 6);
                this.propertyAdd(this.pfTables.phases, "level", 7);
                this.propertyAdd(this.pfTables.orders, "level", 8);
            }, this)
        });
    };
    this.buildTreeTable = function buildTreeTable(tableItems, sParentId) {
        if (this.theTree === null) {
            this.theTree = TreeTableUtils.buildTree({
                items: tableItems,
                idFieldName: this.treeFieldNames.id,
                parentFieldName: this.treeFieldNames.parentId,
                formatFunction: this.formatItemObject
            });
        } else {
            this.theTree = TreeTableUtils.addItemsToParent({
                items: tableItems,
                idFieldName: this.treeFieldNames.id,
                parentId: sParentId,
                tree: this.theTree,
                formatFunction: this.formatItemObject
            });
        }
        var oModel = new sap.ui.model.json.JSONModel();
        oModel.setData(this.theTree);

        if (typeof (this.oTable) === "undefined") this.oTable = sap.ui.getCore().byId(this.fields.treename);
        this.oTable.setModel(oModel);
        this.oTable.bindRows({
            path: "/root"
        });
    };
    this.dialogClose = function dialogClose(oEvent) {
        this.dialog.close();
    };
    this.dialogOpen = function dialogOpen(oEvent) {
        this.initVariables();
        var fieldId = oEvent.getParameter("id");
        var viewId = that.getView().sId + '--';
        fieldId = fieldId.split(viewId).join("");
        // this.pfTypeMax =
        // fieldId.split("PortfolioButton").join("").toUpperCase();

        this.pfTypeMax = this.pfType0.phase;

        if (this.pfTypeMax === "ORDER") this.pfTypeMax = this.pfType0.order; // SERVICEORDER

        if (!this.dialog) {
            this.dialog = sap.ui.xmlfragment(this.getFragment(this.fragments.portfolioTreeTable), this);
            that.getView().addDependent(this.dialog);
        }
        this.dialog.open();

        //
        this.propertyAdd(this.pfTables.buckets2, "_pfTypeMax", this.pfTypeMax);
        this.buildTreeTable(this.pfTables.buckets2);
    };
    this.entitysetRead0 = function entitysetRead(aFilters, expandNode) { // <<<
        that.getView().setBusy(true);
        that.getView().getModel(this.models.ppm).read(this.entitySets.portfolioObjects, {
            filters: aFilters,
            success: jQuery.proxy(function (oData) {
                that.getView().setBusy(false);
                if (oData.results.length > 0) {
                    var objects = oData.results;
                    for (i = 0; i < objects.length; i++) {
                        delete objects[i].__metadata;
                        objects[i]._pfTypeMax = this.pfTypeMax;
                    }
                    this.buildTreeTable(objects, this.selectedObject.Id);
                    if (expandNode) {
                        this.nodeExpandToId(this.selectedObject.Id, false);
                    }
                }
            }, this)
        });
    };
    this.formatItemObject = function formatItemObject(anObject) {
        var formattedObject = {
            id: anObject.id,
            type: anObject.type,
            text: anObject.text,
            parentId: anObject.parentId,
            level: anObject.level
        };
        if (formattedObject.type !== anObject._pfTypeMax) {
            formattedObject["X"] = {};
            formattedObject.isLastLevel = "N";
        } else {
            formattedObject.isLastLevel = "X";
        }

        return formattedObject;
    };
    this.getFragment = function getFragment(fragmentName) {
        return this.appId + fragmentName;
    };
    this.nodeExpand = function nodeExpand(oEvent) {
        var vExpanded = oEvent.getParameter("expanded");
        var vRowContext = oEvent.getParameter("rowContext");
        var index = vRowContext.sPath.split("/");
        var nodeCC;
        if (vExpanded) {
            for (var i = 2; i < index.length; i++) {
                if (!nodeCC)
                    nodeCC = this.theTree.root[index[i]];
                else
                    nodeCC = nodeCC[index[i]];
            }
            this.selectedObject = nodeCC;
            var nextLevel = this.selectedObject.level + 1;
            var nextObjects0 = this.pfTables[this.pfHierLevels[nextLevel]];
            var nextObjects = [];
            for (i = 0; i < nextObjects0.length; i++) {
                if (nextObjects0[i].parentId === this.selectedObject.id) {
                    nextObjects0[i]._pfTypeMax = this.pfTypeMax;
                    nextObjects.push(nextObjects0[i]);
                }
            }
            this.buildTreeTable(nextObjects, this.selectedObject.id);
            this.nodeExpandToId(this.selectedObject.id, false);
        }
    };
    this.nodeExpandToId = function nodeExpandToId(oId, FirstLevel) {
        var indices = TreeTableUtils.getIndices(this.theTree.root, this.treeFieldNames.id, oId);
        var rowIndex = -1;
        var limit = FirstLevel ? indices.length - 1 : indices.length;
        for (var i = 0; i < limit; i++) {
            rowIndex += parseInt(indices[i], 10) + 1;
            this.oTable.expand(rowIndex);
        }
        if (rowIndex > 18)
            this.oTable.setFirstVisibleRow(rowIndex - 3);
    };
    this.nodeSelected = function nodeSelected(oEvent) {
        var vRowContext = oEvent.getParameter("rowContext");
        var index = vRowContext.sPath.split("/");
        var selectedObject;
        for (var i = 2; i < index.length; i++) {
            if (!selectedObject)
                selectedObject = this.theTree.root[index[i]];
            else
                selectedObject = selectedObject[index[i]];
        }
        this.selectedObject = selectedObject;
        if (this.selectedObject.type === this.pfTypeMax) {
            var fieldId = this.pfTypeMax.toLowerCase();
            if (fieldId === "serviceorder") fieldId = "order";
            // that.getView().getModel(this.models.sParam).setProperty("/" +
            // fieldId, this.selectedObject.id);
            that.getView().getModel().setProperty("/" + fieldId, this.selectedObject.id);



            var aListServiceOrder = that.getModel("ListServiceOrder").getData();

            if (!aListServiceOrder[that.iSelectedLine]) {
                return;
            }
            aListServiceOrder[that.iSelectedLine].ParentId = this.selectedObject.id;
            that.getModel("ListServiceOrder").setData(aListServiceOrder);

            this.dialogClose();

        }
    };
    this.propertyAdd = function propertyAdd(objects, pName, pValue) {
        for (i = 0; i < objects.length; i++) {
            objects[i][pName] = pValue;
        }
    };
};
