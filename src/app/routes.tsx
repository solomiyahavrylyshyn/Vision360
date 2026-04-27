import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Verify2FA } from "./pages/Verify2FA";
import { ResetPasswordRequest } from "./pages/ResetPasswordRequest";
import { ResetPasswordForm } from "./pages/ResetPasswordForm";
import { ResetPasswordVerify } from "./pages/ResetPasswordVerify";
import { Welcome } from "./pages/Welcome";
import { CompanySetup } from "./pages/CompanySetup";
import { Dashboard } from "./pages/Dashboard";
import { Clients } from "./pages/Clients";
import { ClientDetail } from "./pages/ClientDetail";
import { CreateClient } from "./pages/CreateClient";
import { CreateEstimate } from "./pages/CreateEstimate";
import { Estimates } from "./pages/Estimates";
import { EstimateDetail } from "./pages/EstimateDetail";
import { Invoices } from "./pages/Invoices";
import { InvoiceDetail } from "./pages/InvoiceDetail";
import { CreateInvoice } from "./pages/CreateInvoice";
import { Payments } from "./pages/Payments";
import { Jobs } from "./pages/Jobs";
import { JobDetail } from "./pages/JobDetail";
import { CreateJob } from "./pages/CreateJob";
import { Events } from "./pages/Events";
import { Calendar } from "./pages/Calendar";
import { Expenses } from "./pages/Expenses";
import { CreateExpense } from "./pages/CreateExpense";
import { Items } from "./pages/Items";
import { ItemDetail } from "./pages/ItemDetail";
import { Accounting } from "./pages/Accounting";
import { Marketing } from "./pages/Marketing";
import { Reports } from "./pages/Reports";
import { Settings } from "./pages/Settings";
import { ManageDuplicates } from "./pages/ManageDuplicates";
import { CreateEvent } from "./pages/CreateEvent";
import { Properties } from "./pages/Properties";
import { CreateProperty } from "./pages/CreateProperty";
import { ServiceAgreements } from "./pages/ServiceAgreements";
import { CreateServiceAgreement } from "./pages/CreateServiceAgreement";
import { CreatePayment } from "./pages/CreatePayment";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/register",
    Component: Register,
  },
  {
    path: "/verify-2fa",
    Component: Verify2FA,
  },
  {
    path: "/reset-password",
    Component: ResetPasswordRequest,
  },
  {
    path: "/reset-password/verify",
    Component: ResetPasswordVerify,
  },
  {
    path: "/reset-password/new-password",
    Component: ResetPasswordForm,
  },
  {
    path: "/welcome",
    Component: Welcome,
  },
  {
    path: "/setup",
    Component: CompanySetup,
  },
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "calendar", Component: Calendar },
      { path: "clients", Component: Clients },
      { path: "clients/new", Component: CreateClient },
      { path: "clients/duplicates", Component: ManageDuplicates },
      { path: "clients/:id", Component: ClientDetail },
      { path: "appointments", Component: Events },
      { path: "appointments/new", Component: CreateEvent },
      { path: "jobs", Component: Jobs },
      { path: "jobs/new", Component: CreateJob },
      { path: "jobs/:id", Component: JobDetail },
      { path: "estimates", Component: Estimates },
      { path: "estimates/new", Component: CreateEstimate },
      { path: "estimates/:id", Component: EstimateDetail },
      { path: "expenses", Component: Expenses },
      { path: "expenses/new", Component: CreateExpense },
      { path: "invoices", Component: Invoices },
      { path: "invoices/new", Component: CreateInvoice },
      { path: "invoices/:id", Component: InvoiceDetail },
      { path: "payments", Component: Payments },
      { path: "payments/new", Component: CreatePayment },
      { path: "properties", Component: Properties },
      { path: "properties/new", Component: CreateProperty },
      { path: "service-agreements", Component: ServiceAgreements },
      { path: "service-agreements/new", Component: CreateServiceAgreement },
      { path: "items", Component: Items },
      { path: "items/:id", Component: ItemDetail },
      { path: "accounting", Component: Accounting },
      { path: "marketing", Component: Marketing },
      { path: "reports", Component: Reports },
      { path: "settings", Component: Settings },
    ],
  },
]);