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

		sProductHelpFragment: "com.amadeus.fiori.ppm.ipf.deiverables.masscreation.view.fragments.ProductHelp",

		onInit: function () {
			this.oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
			this.aMandatoryFields = ["OrderExtTxt", "Parent", "InOutBudget", "Status", "ExpectedStartDate"];
		},
		_createValueHelpFilter: function (sField, sFilterString) {
			var aFilters = [new Filter({
				path: "FieldName",
				operator: FilterOperator.EQ,
				value1: sField
			})];
			if (sFilterString) {
				aFilters.push(new Filter({
					path: "FilterString",
					operator: FilterOperator.EQ,
					value1: sFilterString
				}));
			}
			return aFilters;
		},
		onVhCustomer: function () {
			this.getView().getModel("pfModel").read("/Customers", {
				filters: [],
				success: jQuery.proxy(function (oData) {
					var oValues = oData.results;
					var oModel = new sap.ui.model.json.JSONModel();
					oModel.setData({
						FacetFilterValues: oValues
					});
					this.getView().setModel(oModel, "CustomerModel");
					this.oCustomerDialog = sap.ui.xmlfragment("com.amadeus.fiori.ppm.ipf.deiverables.masscreation.view.fragments.CustomersDialog",
						this);
					var i18nModel = this.getView().getModel("i18n");
					this.oCustomerDialog.setModel(i18nModel, "i18n");
					this.oCustomerDialog.setModel(oModel);
					this.oCustomerDialog.open();
				}, this)
			});
		},
		onDialogClose: function () {
			this.oConfirmDialog.close();
		},

		_createValueHelpFilter: function (sField, sFilterString) {
			var aFilters = [new Filter({
				path: "FieldName",
				operator: FilterOperator.EQ,
				value1: sField
			})];
			if (sFilterString) {
				aFilters.push(new Filter({
					path: "FilterString",
					operator: FilterOperator.EQ,
					value1: sFilterString
				}));
			}
			return aFilters;
		},
		onVhProduct: function () {
			this._callFragmentHelp(this.sProductHelpFragment, "PRODUCTPROFIT");
		},
		_callFragmentHelp: function (sFragment, sField) {
			var oView = this.getView();
			this.sVhField = sField;
			switch (this.sVhField) {
			case 'PRODUCTPROFIT':
				var vhTitle = this.oBundle.getText("Product");
				break;
			case 'IAOS_EMPLOYEE':
				var vhTitle = this.oBundle.getText("Employee");
				break;
			default:
				break;
			}
			// this.getView().getModel().setProperty("/vhDialogTitle", vhTitle);

			// this['_pValueHelpDialog']
			var sVhDialogName = "_pValueHelp" + sField + "Dialog";
			if (!this[sVhDialogName]) {
				this[sVhDialogName] = Fragment.load({
					id: oView.getId(),
					name: sFragment,
					controller: this
				}).then(function (oValueHelpDialog) {
					oView.addDependent(oValueHelpDialog);
					return oValueHelpDialog;
				});
			}

			this[sVhDialogName].then(function (oValueHelpDialog) {
				//Specific case for the tree table
				if (sFragment !== this.sProductTreeHelpFragment) {
					oValueHelpDialog.getBinding("items").attachEventOnce("change", function () {
						this._refocusSearch();
					}.bind(this));
				}

				switch (sFragment) {
				case this.sProductTreeHelpFragment:
					this.oTreeData = null;
					this.oSelectedTreeData = {
						Id: "",
						Modkz: ""
					};
					this._createTreeData("ProductTree");
					break;
				default:
					oValueHelpDialog.getBinding("items").filter(this._createValueHelpFilter(sField));
					break;
				}

				oValueHelpDialog.open();
			}.bind(this));
		},

		_onVhClose: function (evt) {
			var oSelectedItem = evt.getParameter("selectedItem");
			switch (this.sVhField) {
			case 'PRODUCTPROFIT':
				this.getModel("updateObject").setProperty("/Product", oSelectedItem.getDescription());
				this.getModel("updateObject").setProperty("/ProductTxt", oSelectedItem.getTitle());
				break;
			case 'IAOS_EMPLOYEE':
				this.getModel("updateObject").setProperty("/Responsible", oSelectedItem.getDescription());
				this.getModel("updateObject").setProperty("/ResponsibleTxt", oSelectedItem.getTitle());
				break;
			default:
				break;
			}

			this._pValueHelpDialog = null;
		},
		_onVhSearchProduct: function (oEvt) {
			this._vhSearch(oEvt, "PRODUCTPROFIT");
		},
		// onPortfolioDialogOpen: function (oEvent) {
		// 	if (typeof (this.pfTree) === "undefined") {
		// 		this.pfTree = new PfTree(this, TreeTableUtils, this.oObject, this.oBundle);
		// 		this.pfTree.init();
		// 	}
		// 	this.pfTree.dialogOpen(oEvent);

		// 	// Open hierarychy at the position of the Parent Item
		// 	if (this.oObject !== "null") {
		// 		this.pfTree.nodeExpandToId2(this.oObject.BuId); //1A-xx
		// 		this.pfTree.nodeExpandToId2(this.oObject.Gl0Id); //1A-xx-xx
		// 		this.pfTree.nodeExpandToId2(this.oObject.Gl1Id); //1A-xx-xx-xx
		// 		this.pfTree.nodeExpandToId2(this.oObject.Gl2Id); //1A-xx-xx-xx-xx
		// 		this.pfTree.nodeExpandToId2(this.oObject.Item);
		// 	}
		// },
		// function PfTree(that, TreeTableUtils, oObject0, oBundle) {
		// 	this.appId = "com.amadeus.fiori.ppm.ipf.deiverables.masscreation.view.fragments.";
		// 	this.fragments = {
		// 		portfolioTreeTable: "PortfolioTreeTable"
		// 	};
		// 	this.fields = {
		// 		treename: "pfTree"
		// 	};
		// 	this.models = {
		// 		ppm: "ppm",
		// 		sParam: "sParam",
		// 		selection: "selection",
		// 		so: null
		// 	};
		// 	this.entitySets = {
		// 		portfolioObjects: "/PortfolioObjects"
		// 	};
		// 	this.pfType0 = {
		// 		bucket: "BUCKET",
		// 		item: "ITEM",
		// 		phase: "PHASE",
		// 		order: "SERVICEORDER"
		// 	};
		// 	this.pfType = {
		// 		item: "IT",
		// 		phase: "PH",
		// 		order: "SO"
		// 	};
		// 	this.pfHierLevels = {
		// 		1: "buckets1",
		// 		2: "buckets2",
		// 		3: "buckets3",
		// 		4: "buckets4",
		// 		5: "buckets5",
		// 		6: "items",
		// 		7: "phases",
		// 		8: "orders"
		// 	};
		// 	this.oTable = sap.ui.getCore().byId(this.fields.treename);
		// 	this.treeFieldNames = {
		// 		id: "id",
		// 		parentId: "parentId"
		// 	};
		// 	this.pfTables = {};
		// 	this.oObject0 = oObject0;
		// 	this.oBundle = oBundle;

		// 	this.initVariables = function initVariables() {
		// 		this.theTree = null;
		// 		this.selectedObject = {
		// 			Id: "",
		// 			Type: "",
		// 			ParentId: ""
		// 		};
		// 		this.pfTypeMax = "";

		// 	};
		// 	this.init = function init() {
		// 		this.initVariables();
		// 		this.refreshTrees();
		// 	};
		// 	this.refreshTrees = function refreshTrees() {
		// 		com.amadeus.fiori.ppm.commons.util.Utils.openBusyDialog(this);
		// 		// Read Buckets, Items, Phases, Orders
		// 		that.getView().getModel().callFunction("/BipoGet", {
		// 			method: "GET",
		// 			error: jQuery.proxy(function (_oData) {
		// 				com.amadeus.fiori.ppm.commons.util.Utils.closeBusyDialog(this);
		// 				sap.m.MessageBox.error("Error during Portfolio read");
		// 			}, this),
		// 			success: jQuery.proxy(function (oData) {
		// 				com.amadeus.fiori.ppm.commons.util.Utils.closeBusyDialog(this);
		// 				console.log("BipoGet executed");
		// 				this.pfTables = {
		// 					buckets1: JSON.parse(oData.Buckets1),
		// 					buckets2: JSON.parse(oData.Buckets2),
		// 					buckets3: JSON.parse(oData.Buckets3),
		// 					buckets4: JSON.parse(oData.Buckets4),
		// 					buckets5: JSON.parse(oData.Buckets5),
		// 					items: JSON.parse(oData.Items),
		// 					phases: JSON.parse(oData.Phases),
		// 					orders: JSON.parse(oData.Orders)
		// 				};
		// 				this.pfTables.buckets1[0].isLastLevel = "";
		// 				this.pfTables.buckets1[0].isSelectable = "";
		// 				this.pfTables.buckets2.push(this.pfTables.buckets1[0]);

		// 				// add 'type' to retrieved collections
		// 				this.propertyAdd(this.pfTables.buckets1, "type", this.pfType0.bucket);
		// 				this.propertyAdd(this.pfTables.buckets2, "type", this.pfType0.bucket);
		// 				this.propertyAdd(this.pfTables.buckets3, "type", this.pfType0.bucket);
		// 				this.propertyAdd(this.pfTables.buckets4, "type", this.pfType0.bucket);
		// 				this.propertyAdd(this.pfTables.buckets5, "type", this.pfType0.bucket);
		// 				this.propertyAdd(this.pfTables.items, "type", this.pfType0.item);
		// 				this.propertyAdd(this.pfTables.phases, "type", this.pfType0.phase);
		// 				this.propertyAdd(this.pfTables.orders, "type", this.pfType0.order);

		// 				// add 'level' to retrieved collections
		// 				this.propertyAdd(this.pfTables.buckets1, "level", 1);
		// 				this.propertyAdd(this.pfTables.buckets2, "level", 2);
		// 				this.propertyAdd(this.pfTables.buckets3, "level", 3);
		// 				this.propertyAdd(this.pfTables.buckets4, "level", 4);
		// 				this.propertyAdd(this.pfTables.buckets5, "level", 5);
		// 				this.propertyAdd(this.pfTables.items, "level", 6);
		// 				this.propertyAdd(this.pfTables.phases, "level", 7);
		// 				this.propertyAdd(this.pfTables.orders, "level", 8);

		// 				//
		// 				this.pfTables.parents = [];
		// 				for (let i = 0; i < this.pfTables.items.length; i++) {
		// 					this.pfTables.parents.push({
		// 						Code: this.pfTables.items[i].id,
		// 						Description: this.pfTables.items[i].text,
		// 						CodeDescription: ("Item" + this.pfTables.items[i].id + this.pfTables.items[i].text).toUpperCase(),
		// 						Type: "IT"
		// 					});
		// 				}
		// 				for (let i = 0; i < this.pfTables.phases.length; i++) {
		// 					this.pfTables.parents.push({
		// 						Code: this.pfTables.phases[i].id,
		// 						Description: this.pfTables.phases[i].text,
		// 						CodeDescription: ("Phase" + this.pfTables.phases[i].id + this.pfTables.phases[i].text).toUpperCase(),
		// 						Type: "PH"
		// 					});
		// 				}
		// 				var ipoModel = new sap.ui.model.json.JSONModel();
		// 				ipoModel.setData({
		// 					ValueHelps: this.pfTables.parents
		// 				});
		// 				that.getView().setModel(ipoModel, "ipoModel");

		// 			}, this)
		// 		});
		// 	};
		// 	this.buildTreeTable = function buildTreeTable(tableItems, sParentId) {
		// 		if (this.theTree === null) {
		// 			this.theTree = TreeTableUtils.buildTree({
		// 				items: tableItems,
		// 				idFieldName: this.treeFieldNames.id,
		// 				parentFieldName: this.treeFieldNames.parentId,
		// 				formatFunction: this.formatItemObject
		// 			});
		// 		} else {
		// 			this.theTree = TreeTableUtils.addItemsToParent({
		// 				items: tableItems,
		// 				idFieldName: this.treeFieldNames.id,
		// 				parentId: sParentId,
		// 				tree: this.theTree,
		// 				formatFunction: this.formatItemObject
		// 			});
		// 		}
		// 		var oModel = new sap.ui.model.json.JSONModel();
		// 		oModel.setData(this.theTree);

		// 		if (typeof (this.oTable) === "undefined") this.oTable = sap.ui.getCore().byId(this.fields.treename);
		// 		this.oTable.setModel(oModel);
		// 		this.oTable.bindRows({
		// 			path: "/root"
		// 		});
		// 	};
		// 	this.portfolioDialogClose = function portfolioDialogClose(_oEvent) {
		// 		this.dialog.close();
		// 	};
		// 	this.dialogClose = function dialogClose(_oEvent) {
		// 		this.dialog.close();
		// 	};
		// 	this.dialogOpen = function dialogOpen(oEvent) {
		// 		this.initVariables();
		// 		var fieldId = oEvent.getParameter("id");
		// 		var viewId = that.getView().sId + '--';
		// 		fieldId = fieldId.split(viewId).join("");
		// 		//this.pfTypeMax = fieldId.split("PortfolioButton").join("").toUpperCase();

		// 		this.pfTypeMax = this.pfType0.phase;

		// 		if (this.pfTypeMax === "ORDER") this.pfTypeMax = this.pfType0.order; //SERVICEORDER

		// 		if (!this.dialog) {
		// 			this.dialog = sap.ui.xmlfragment(this.getFragment(this.fragments.portfolioTreeTable), this);
		// 			that.getView().addDependent(this.dialog);
		// 		}
		// 		this.dialog.open();

		// 		//
		// 		this.propertyAdd(this.pfTables.buckets2, "_pfTypeMax", this.pfTypeMax);
		// 		this.buildTreeTable(this.pfTables.buckets2);
		// 	};
		// 	this.entitysetRead0 = function entitysetRead(aFilters, expandNode) { //<<<
		// 		that.getView().setBusy(true);
		// 		that.getView().getModel(this.models.ppm).read(this.entitySets.portfolioObjects, {
		// 			filters: aFilters,
		// 			success: jQuery.proxy(function (oData) {
		// 				that.getView().setBusy(false);
		// 				if (oData.results.length > 0) {
		// 					var objects = oData.results;
		// 					for (i = 0; i < objects.length; i++) {
		// 						delete objects[i].__metadata;
		// 						objects[i]._pfTypeMax = this.pfTypeMax;
		// 					}
		// 					this.buildTreeTable(objects, this.selectedObject.Id);
		// 					if (expandNode) {
		// 						this.nodeExpandToId(this.selectedObject.Id, false);
		// 					}
		// 				}
		// 			}, this)
		// 		});
		// 	};

		// 	this.formatItemObject = function formatItemObject(anObject) {
		// 		var formattedObject = {
		// 			id: anObject.id,
		// 			type: anObject.type,
		// 			text: anObject.text,
		// 			parentId: anObject.parentId,
		// 			level: anObject.level
		// 		};
		// 		if (formattedObject.type === "ITEM") {
		// 			formattedObject.modelAttribute = anObject.modelAttribute;
		// 			formattedObject.modelAttributeTxt = anObject.modelAttributeTxt;
		// 		}
		// 		if (formattedObject.type !== anObject._pfTypeMax) {
		// 			formattedObject["X"] = {};
		// 			formattedObject.isLastLevel = "N";
		// 		} else {
		// 			formattedObject.isLastLevel = "X";
		// 		}
		// 		if (formattedObject.type === "ITEM" || formattedObject.type === "PHASE") {
		// 			formattedObject.isSelectable = "X";
		// 		} else {
		// 			formattedObject.isSelectable = "N";
		// 		}
		// 		return formattedObject;
		// 	};
		// 	this.getFragment = function getFragment(fragmentName) {
		// 		return this.appId + fragmentName;
		// 	};
		// 	this.nodeExpand = function nodeExpand(oEvent) {
		// 		var vExpanded = oEvent.getParameter("expanded");
		// 		var vRowContext = oEvent.getParameter("rowContext");
		// 		var index = vRowContext.sPath.split("/");
		// 		var nodeCC;
		// 		if (vExpanded) {
		// 			for (var i = 2; i < index.length; i++) {
		// 				if (!nodeCC)
		// 					nodeCC = this.theTree.root[index[i]];
		// 				else
		// 					nodeCC = nodeCC[index[i]];
		// 			}
		// 			this.selectedObject = nodeCC;
		// 			var nextLevel = this.selectedObject.level + 1;
		// 			var nextObjects0 = this.pfTables[this.pfHierLevels[nextLevel]];
		// 			var nextObjects = [];
		// 			for (i = 0; i < nextObjects0.length; i++) {
		// 				if (nextObjects0[i].parentId === this.selectedObject.id) {
		// 					nextObjects0[i]._pfTypeMax = this.pfTypeMax;
		// 					nextObjects.push(nextObjects0[i]);
		// 				}
		// 			}
		// 			this.buildTreeTable(nextObjects, this.selectedObject.id);
		// 			this.nodeExpandToId(this.selectedObject.id, false);
		// 		}
		// 	};
		// 	this.nodeExpandToId2 = function nodeExpandToId2(sId) {
		// 		var nextLevel = sId.split("-").length + 1;
		// 		if (sId.substring(0, 2) !== "1A")
		// 			nextLevel = nextLevel + 4;
		// 		var nextObjects0 = this.pfTables[this.pfHierLevels[nextLevel]];
		// 		var nextObjects = [];
		// 		for (let i = 0; i < nextObjects0.length; i++) {
		// 			if (nextObjects0[i].parentId === sId) {
		// 				nextObjects0[i]._pfTypeMax = this.pfTypeMax;
		// 				nextObjects.push(nextObjects0[i]);
		// 			}
		// 		}
		// 		this.buildTreeTable(nextObjects, sId);
		// 		this.nodeExpandToId(sId, false);
		// 	};
		// 	this.nodeExpandToId = function nodeExpandToId(oId, FirstLevel) {
		// 		var indices = TreeTableUtils.getIndices(this.theTree.root, this.treeFieldNames.id, oId);
		// 		var rowIndex = -1;
		// 		var limit = FirstLevel ? indices.length - 1 : indices.length;
		// 		for (var i = 0; i < limit; i++) {
		// 			rowIndex += parseInt(indices[i], 10) + 1;
		// 			this.oTable.expand(rowIndex);
		// 		}
		// 		if (rowIndex > 18)
		// 			this.oTable.setFirstVisibleRow(rowIndex - 3);
		// 	};
		// 	this.nodeSelected = function nodeSelected(oEvent) {
		// 		var vRowContext = oEvent.getParameter("rowContext");
		// 		var index = vRowContext.sPath.split("/");
		// 		var selectedObject;
		// 		for (var i = 2; i < index.length; i++) {
		// 			if (!selectedObject)
		// 				selectedObject = this.theTree.root[index[i]];
		// 			else
		// 				selectedObject = selectedObject[index[i]];
		// 		}
		// 		this.selectedObject = selectedObject;

		// 		// Checks
		// 		if (this.selectedObject.type === this.pfType0.item) {
		// 			if (this.selectedObject.modelAttribute === "5300" || this.selectedObject.modelAttribute === "4200") {
		// 				sap.m.MessageBox.error(this.oBundle.getText("ErrMsgModelAttribute")); //You can not select an item with Model Attribute Others or Structural Costs
		// 				return;
		// 			}
		// 		}
		// 		if (this.oObject0 !== null) {
		// 			if (this.oObject0.Parent !== this.selectedObject.id) {
		// 				var selectedParentItem = this.selectedObject.type === this.pfType0.item ? this.selectedObject.id : this.selectedObject.parentId;
		// 				if (selectedParentItem !== this.oObject0.Item) {
		// 					sap.m.MessageBox.error(this.oBundle.getText("ErrMsgDeliverableMoveOtherItem")); //Deliverable cannot be moved to another parent item as this will impact the BPOP
		// 					return;
		// 				}
		// 			}
		// 		}

		// 		// 
		// 		if (this.selectedObject.type === this.pfType0.item || this.selectedObject.type === this.pfType0.phase) {
		// 			that.getView().getModel("updateObject").setProperty("/Parent", this.selectedObject.id);
		// 			that.getView().getModel("updateObject").setProperty("/ParentTxt", this.selectedObject.text);
		// 			this.dialogClose();
		// 		}
		// 	};
		// 	this.propertyAdd = function propertyAdd(objects, pName, pValue) {
		// 		for (i = 0; i < objects.length; i++) {
		// 			objects[i][pName] = pValue;
		// 		}
		// 	};
		// },
		_checkControls: function (aData) {
			//	var oVHModel = this.getView().getModel("valueStates");
			//	//	var oVHState = oVHModel.getData();

			aData = this.getView().getModel("ListServiceOrder").getData().length ? this.getView().getModel("ListServiceOrder").getData() :
				aData;

			var bReturn = true;
			var oBundle = this.oBundle;
			aData.forEach(function (oData) {
				var oError = {
					"Warning": []
				};
				var i = 0;
				this.aMandatoryFields.forEach(function (sProperty) {
					if (!oData[sProperty]) {
						oData[sProperty + "State"] = "Error";
						oError.Warning.push({
							code: '',
							message: oBundle.getText("ErrorMessage_Missing_filled_" + sProperty),
							severity: "E",
							target: ''
						})
						i++;
						//oError.push();

						bReturn = false;
					} else {
						oData[sProperty + "State"] = "None";
					}
				}.bind(this));
				oData.Error = oError;
				oData.WarningCount = i;
			}.bind(this));
			this.getView().getModel("ListServiceOrder").setProperty("/", aData);
			return bReturn;
		},
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
		onWarningButtonPressed: function (oEvent) {
			// Get the data from the Table view
			var sListServiceOrder = oEvent.getSource().getParent().getBindingContext('ListServiceOrder').getObject();
			// Start dialogue
			// Utils.openBusyDialog(this);
			// check table is empty
			if (sListServiceOrder.Error && sListServiceOrder.Error.Warning.length > 0) {
				// Display list in dialogueBox
				this._handleMessages(sListServiceOrder.Error.Warning);
			}
			// close dialogue
			//  Utils.closeBusyDialog(this);
		},
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

						var aRefinedData = this._refineData(aData);
						aRefinedData.forEach(function (oRData) {
							this._addStaticValues(oRData);
						}.bind(this));

						this.getView().getModel("ListServiceOrder").setData(aRefinedData);
						this._checkControls(aData);
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
		_prepareForDownload: function (aData) {
			var aPropertyMap = [{
					"source": this.oBundle.getText("Parent"),
					"target": "Parent"
				}, {
					"source": this.oBundle.getText("OrderId"),
					"target": "OrderId"
				}, {
					"source": this.oBundle.getText("OrderType"),
					"target": "OrderType"
				}, {
					"source": this.oBundle.getText("InOutBudget"),
					"target": "InOutBudget"
				}, {
					"source": this.oBundle.getText("Responsible"),
					"target": "Responsible"
				}, {
					"source": this.oBundle.getText("ExpectedStartDate"),
					"target": "ExpectedStartDate"
				}, {
					"source": this.oBundle.getText("ExpectedDeliveryDate"),
					"target": "ExpectedDeliveryDate"
				}, {
					"source": this.oBundle.getText("SoGrouping"),
					"target": "SoGrouping"
				}, {
					"source": this.oBundle.getText("ExternalLinkUrl"),
					"target": "ExternalLinkUrl"
				}, {
					"source": this.oBundle.getText("Description"),
					"target": "OrderExtTxt"
				}, {
					"source": this.oBundle.getText("LongDescription"),
					"target": "OrderLongTxt"
				}, {
					"source": this.oBundle.getText("DeliverableStatus"),
					"target": "Status"
				}, {
					"source": this.oBundle.getText("ExtSystId"),
					"target": "ExternalSystemTicketId"
				}, {
					"source": this.oBundle.getText("Objective"),
					"target": "ObjectiveLongTxt"
				}, {
					"source": this.oBundle.getText("Priority"),
					"target": "Priority"
				}, {
					"source": this.oBundle.getText("Rank"),
					"target": "Rank"
				}, {
					"source": this.oBundle.getText("Product"),
					"target": "Product"
				}, {
					"source": this.oBundle.getText("Customer"),
					"target": "Customer"
				}, {
					"source": this.oBundle.getText("InvestmentProfile"),
					"target": "InvestmentProfile"
				}

			];
			var aRefinedData = [];
			aData.forEach(function (oItem) {
				aPropertyMap.forEach(function (oProperty) {
					oItem[oProperty.source] = oItem[oProperty.target];
				});
				aRefinedData.push(oItem);
			});
			return aRefinedData;
		},
		_refineData: function (aData) {
			var aPropertyMap = [{
					"target": this.oBundle.getText("Parent"),
					"source": "Parent"
				}, {
					"target": this.oBundle.getText("OrderId"),
					"source": "OrderId"
				}, {
					"target": this.oBundle.getText("OrderType"),
					"source": "OrderType"
				}, {
					"target": this.oBundle.getText("InOutBudget"),
					"source": "InOutBudget"
				}, {
					"target": this.oBundle.getText("Responsible"),
					"source": "Responsible"
				}, {
					"target": this.oBundle.getText("ExpectedStartDate"),
					"source": "ExpectedStartDate"
				}, {
					"target": this.oBundle.getText("ExpectedDeliveryDate"),
					"source": "ExpectedDeliveryDate"
				}, {
					"target": this.oBundle.getText("SoGrouping"),
					"source": "SoGrouping"
				}, {
					"target": this.oBundle.getText("ExternalLinkUrl"),
					"source": "ExternalLinkUrl"
				}, {
					"target": this.oBundle.getText("Description"),
					"source": "OrderExtTxt"
				}, {
					"target": this.oBundle.getText("LongDescription"),
					"source": "OrderLongTxt"
				}, {
					"target": this.oBundle.getText("DeliverableStatus"),
					"source": "Status"
				}, {
					"target": this.oBundle.getText("ExtSystId"),
					"source": "ExternalSystemTicketId"
				}, {
					"target": this.oBundle.getText("Objective"),
					"source": "ObjectiveLongTxt"
				}, {
					"target": this.oBundle.getText("Priority"),
					"source": "Priority"
				}, {
					"target": this.oBundle.getText("Rank"),
					"source": "Rank"
				}, {
					"target": this.oBundle.getText("Product"),
					"source": "Product"
				}, {
					"target": this.oBundle.getText("Customer"),
					"source": "Customer"
				}, {
					"target": this.oBundle.getText("InvestmentProfile"),
					"source": "InvestmentProfile"
				}

			];
			var aDateProperty = ["ExpectedStartDate", "ExpectedDeliveryDate"];
			var aRefinedData = [];
			aData.forEach(function (oItem) {
				aPropertyMap.forEach(function (oProperty) {
					oItem[oProperty.source] = oItem[oProperty.target];
				});
				aRefinedData.push(oItem);
				aDateProperty.forEach(function (oDateProperty) {
					oItem[oDateProperty] = new Date(oItem[oDateProperty].split(".").reverse().join("-") + "GMT")
				});

			});
			return aRefinedData;
		},
		/**
		 * Download to Excel
		 */
		onExcelDownloadPressed: function () {
			var aData = this.getView().getModel("ListServiceOrder").oData;
			aData = this._prepareForDownload(aData);
			if (aData.length > 0) {
				var aCols = this._createColumnListForExcel("MainTable");
				var oSheet = new Spreadsheet({
					workbook: {
						columns: aCols
					},
					dataSource: aData
				});
				oSheet.build().then().finally(oSheet.destroy);
			} else {
				//Aziz Kaouass - Add an error message if the table is empty
				var oBundle = this.getModel("i18n").getResourceBundle();
				MessageToast.show(oBundle.getText("ErrorMessage_Empty_Table_Excel"));
			}
		},
		onRemoveLineButtonPressed: function (oEvent) {
			var sPath = oEvent.getSource().getBindingContext("ListServiceOrder").getPath();
			var iIndex = sPath.split("/")[1];
			var aData = this.getView().getModel("ListServiceOrder").getProperty("/");
			aData.splice(iIndex, 1);
			this.getView().getModel("ListServiceOrder").setProperty("/", aData);
		},
		_addStaticValues: function (oDataItem) {
			var aStaticConfig = [{
				"key": "OrderId",
				"value": "%00000000001"
			}, {
				"key": "OrderType",
				"value": "YDEL"
			}, {
				"key": "InOutBudget",
				"value": "IN"
			}, {
				"key": "Status",
				"value": "ANA"
			}];
			aStaticConfig.forEach(function (oConfig) {
				oDataItem[oConfig.key] = oConfig.value;
			}.bind(this));
			return oDataItem;
		},
		onAddNewLinePressed: function () {
			var oDataItem = {};
			var aDateProperty = ["ExpectedStartDate", "ExpectedDeliveryDate"];
			this.getView().byId("MainTable").getColumns().forEach(function (oCol) {
				if (oCol.getLabel().getText()) {
					if (aDateProperty.indexOf(oCol.getLabel().getText()) !== -1) {
						oDataItem[oCol.getLabel().getText()] = null;
					} else {
						oDataItem[oCol.getLabel().getText()] = "";
					}
				}
			}.bind(this));
			var aData = this.getView().getModel("ListServiceOrder").getProperty("/") ? this.getView().getModel("ListServiceOrder").getProperty(
				"/") : [];
			if (!aData.length) {
				aData = [];
			}
			oDataItem = this._addStaticValues(oDataItem);
			aData.push(oDataItem);
			this.getView().getModel("ListServiceOrder").setProperty("/", aData);
		},
		onSuggestParent: function (oEvent) {
			this.byId("ParentTxt").setText("");
			this.byId("Parent").setValueState(sap.ui.core.ValueState.None);
			var aFilters = [],
				aAndFilters = [];
			var sTerm = oEvent.getParameter("suggestValue").toUpperCase();
			if (sTerm) {
				aFilters.push(new Filter("CodeDescription", FilterOperator.Contains, sTerm));
			}
			if (typeof (this.oObject0) !== "undefined") {
				var aWords = this.oObject0.Parent.split("-");
				var parent = aWords[0] + "-" + aWords[1];
				aFilters.push(new Filter("Code", FilterOperator.Contains, parent));
				aAndFilters.push(new Filter(aFilters, true));
			}
			if (aAndFilters.length > 0) aFilters = aAndFilters;
			oEvent.getSource().getBinding("suggestionItems").filter(aFilters);
			oEvent.getSource().setFilterSuggests(false); //Do not filter the provided suggestions before showing them to the user
		},
		/**
		 * Download Excel template
		 */
		onExcelTemplatePressed: function () {
			var aData = [];
			var aCols = this._createColumnListForExcel("MainTable");
			var oSheet = new Spreadsheet({
				workbook: {
					columns: aCols
				},
				dataSource: [{}],
				fileName: "Deliverables Mass Creation.xlsx"
			});
			oSheet.build().then().finally(oSheet.destroy);
		},

		_createColumnListForExcel: function (sTable) {
			var EdmType = exportLibrary.EdmType;
			var oMapping = (this.getView().byId(sTable).getColumns() || []).map(function (oItem) {
				var oDataMap = {
					label: oItem.getLabel().getText(),
					// Sort property is easier to get here and always have
					// the same field name as the binding
					property: oItem.getSortProperty()
				};
				var aDateProperty = ["ExpectedStartDate", "ExpectedDeliveryDate"];
				if (aDateProperty.indexOf(oItem.getLabel().getText()) !== -1) {
					oDataMap.type = EdmType.Date;
				} else {
					oDataMap.type = EdmType.String;
				}
				// // Avoid data without column header (like the one for
				// edit/delete button)
				if (oDataMap.label) {
					return oDataMap;
				}
			});
			return oMapping;
		},
		onSave: function () {
			var aData = this.getView().getModel("ListServiceOrder").getData();
			if(!aData.length){
				return;
			}
			var aProps = this._getCreateProperties();
			var aCreateData = [];
			aData.forEach(function(oItem){
				var oCreateData = {};
				aProps.forEach(function(oProperty){
					oCreateData[oProperty] = oItem[oProperty];
				}.bind(this));
				aCreateData.push(oCreateData);
			}.bind(this));
			var aPromise = [];
			aCreateData.forEach(function(oCreateData){
				aPromise.push(this._createPromise("/Deliverables").callService("create",oCreateData,{}));
			}.bind(this));
			Promise.all(aPromise).then(function(){}.bind(this));
		},
		_createPromise:function(url){
				
			var me ={model:this.getview().getModel()};
			var core = {
				ajax: function (type, url, data, parameters) {
					var promise = new Promise(function (resolve, reject) {
						var args = [];
						var params = {};
						args.push(url);
						if (data) {
							args.push(data);
						}
						if (parameters) {
							params = parameters;
						}
						params.success = function (result, response) {
							resolve({
								data: result,
								response: response
							});
						};
						params.error = function (error) {
							reject(error);
						};
						args.push(params);
						me.model[type].apply(me.model, args);
					});
					return promise;
				}
			};

			return {
			
				"callService":function(type,data, parameters){
					return core.ajax(type,url,data,parameters);
				}
			};
	
		},
		_getCreateProperties: function () {
			return ["OrderId", "Parent", "OrderType", "OrderExtTxt", "OrderLongTxt", "Status", "InOutBudget", "Responsible",
				"ExpectedStartDate", "ExpectedDeliveryDate", "SoGrouping", "ExternalLinkUrl", "ExternalSystemTicketId", "ObjectiveLongTxt",
				"Priority","Rank","Product","Customer","InvestmentProfile","CommitmentLevel"];
			
		}

	
      }
);
});
