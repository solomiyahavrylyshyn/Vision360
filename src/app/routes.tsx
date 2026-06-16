import { createBrowserRouter, useRouteError } from "react-router-dom";
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
import { Home } from "./pages/Home";
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
import { PaymentDetail } from "./pages/PaymentDetail";
import { Jobs } from "./pages/Jobs";
import { JobDetail } from "./pages/JobDetail";
import { CreateJob } from "./pages/CreateJob";
import { Events } from "./pages/Events";
import { Calendar } from "./pages/Calendar";
import { Expenses } from "./pages/Expenses";
import { ExpenseDetail } from "./pages/ExpenseDetail";
import { CreateExpense } from "./pages/CreateExpense";
import { Items } from "./pages/Items";
import { CreateItem } from "./pages/CreateItem";
import { ItemDetail } from "./pages/ItemDetail";
import { Accounting } from "./pages/Accounting";
import { Marketing } from "./pages/Marketing";
import { Reports } from "./pages/Reports";
import { Settings } from "./pages/Settings";
import { NewUser } from "./pages/NewUser";
import { ManageDuplicates } from "./pages/ManageDuplicates";
import { CreateEvent } from "./pages/CreateEvent";
import { Properties } from "./pages/Properties";
import { CreateProperty } from "./pages/CreateProperty";
import { ServiceAgreements } from "./pages/ServiceAgreements";
import { CreateServiceAgreement } from "./pages/CreateServiceAgreement";
import { CreatePayment } from "./pages/CreatePayment";
import { Profile } from "./pages/Profile";
import { HelpCenter } from "./pages/HelpCenter";
import { Account } from "./pages/Account";

// Friendly error page shown instead of React Router's default "Hey developer 👈"
// dev message + raw stack trace (which must never reach end users).
function RouteError() {
  const error = useRouteError() as { status?: number } | undefined;
  const isNotFound = error?.status === 404;
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA] p-6">
      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-sm p-8 max-w-[460px] w-full text-center">
        <span className="material-icons text-[#DC2626] mb-2 block" style={{ fontSize: 40 }}>
          {isNotFound ? "search_off" : "error_outline"}
        </span>
        <h1 className="text-[20px] text-[#1A2332] mb-1" style={{ fontWeight: 600 }}>
          {isNotFound ? "Page not found" : "Something went wrong"}
        </h1>
        <p className="text-[14px] text-[#6B7280] mb-5">
          {isNotFound
            ? "That page doesn’t exist or may have moved."
            : "An unexpected error occurred. Please try again, or return to the dashboard."}
        </p>
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => window.location.reload()} className="h-9 px-4 rounded-lg border border-[#E5E7EB] text-[#1A2332] text-[14px] hover:bg-[#F5F7FA]" style={{ fontWeight: 500 }}>Reload</button>
          <a href="/" className="h-9 px-4 inline-flex items-center rounded-lg bg-[#4A6FA5] text-white text-[14px] hover:bg-[#3d5a85]" style={{ fontWeight: 500 }}>Go to dashboard</a>
        </div>
      </div>
    </div>
  );
}

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
    ErrorBoundary: RouteError,
    children: [
      { index: true, Component: Home },
      { path: "calendar", Component: Calendar },
      { path: "schedule", Component: Calendar }, // alias — "Schedule" nav + direct /schedule links
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
      { path: "expenses/:id", Component: ExpenseDetail },
      { path: "invoices", Component: Invoices },
      { path: "invoices/new", Component: CreateInvoice },
      { path: "invoices/:id", Component: InvoiceDetail },
      { path: "payments", Component: Payments },
      { path: "payments/new", Component: CreatePayment },
      { path: "payments/:id", Component: PaymentDetail },
      { path: "properties", Component: Properties },
      { path: "properties/new", Component: CreateProperty },
      { path: "service-agreements", Component: ServiceAgreements },
      { path: "service-agreements/new", Component: CreateServiceAgreement },
      { path: "items", Component: Items },
      { path: "items/new", Component: CreateItem },
      { path: "items/:id", Component: ItemDetail },
      { path: "accounting", Component: Accounting },
      { path: "marketing", Component: Marketing },
      { path: "reports", Component: Reports },
      { path: "settings", Component: Settings },
      { path: "settings/team/new", Component: NewUser },
      { path: "profile", Component: Profile },
      { path: "help", Component: HelpCenter },
      { path: "account", Component: Account },
    ],
  },
]);