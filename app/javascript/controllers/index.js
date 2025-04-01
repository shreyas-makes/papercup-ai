// Import and register all your controllers from the importmap under controllers/*

import { application } from "controllers/application"

// Import countries data to ensure it's available
import "../data/countries"

// Import and register custom controllers
import DebugPanelController from "./debug_panel_controller"
import LoginModalController from "./login_modal_controller"
import PackageSelectionController from "./package_selection_controller"

application.register("debug-panel", DebugPanelController)
application.register("login-modal", LoginModalController)
application.register("package-selection", PackageSelectionController)

// Eager load all controllers defined in the import map under controllers/**/*_controller
import { eagerLoadControllersFrom } from "@hotwired/stimulus-loading"
eagerLoadControllersFrom("controllers", application)

// Lazy load controllers as they appear in the DOM (remember not to preload controllers in import map!)
// import { lazyLoadControllersFrom } from "@hotwired/stimulus-loading"
// lazyLoadControllersFrom("controllers", application)
