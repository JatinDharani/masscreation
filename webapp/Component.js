/**
 * eslint-disable @sap/ui5-jsdocs/no-jsdoc
 */
jQuery.sap.registerModulePath("com.amadeus.fiori.ppm.commons.controller", "/sap/bc/ui5_ui5/sap/zhfr_vs_commons/controller/"); //<<<ExternalModule.1
jQuery.sap.registerModulePath("com.amadeus.fiori.ppm.commons.util", "/sap/bc/ui5_ui5/sap/zhfr_vs_commons/util/"); //<<<ExternalModule.1
jQuery.sap.registerModulePath("com.amadeus.fiori.ppm.commons", "/sap/bc/ui5_ui5/sap/zhfr_commons/"); //<<<ExternalModule.1

sap.ui.define([
        "sap/ui/core/UIComponent",
        "sap/ui/Device",
        "com/amadeus/fiori/ppm/ipf/deiverables/masscreation/model/models",
        "sap/ui/model/json/JSONModel"
    ],
    function (UIComponent, Device, models,JSONModel) {
        "use strict";

        return UIComponent.extend("com.amadeus.fiori.ppm.ipf.deiverables.masscreation.Component", {
            metadata: {
                manifest: "json",
                config: {
                    fullWidth: true
                }
            },

            /**
             * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
             * @public
             * @override
             */
            init: function () {
               	// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);
			
			this.setModel(new JSONModel(), "app");
			
			// create the views based on the url/hash
			this.getRouter().initialize();
			
            this._includeScripts();
            },
            _includeScripts:function(){
                var jQueryScript = document.createElement('script');
                jQueryScript.setAttribute('src', 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.10.0/jszip.js');
                document.head.appendChild(jQueryScript);
            
            
                var jQueryScript = document.createElement('script');
                jQueryScript.setAttribute('src', 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.10.0/xlsx.js');
                document.head.appendChild(jQueryScript);
            },
            	/**
		 * The component is destroyed by UI5 automatically.
		 * In this method, the ErrorHandler is destroyed.
		 * @public
		 * @override
		 */
		destroy: function() {
			// call the base component's destroy function
			UIComponent.prototype.destroy.apply(this, arguments);
		}
        });
    }
);