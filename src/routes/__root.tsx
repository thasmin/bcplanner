import { TanStackDevtools } from "@tanstack/react-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import Header from "../components/Header";
import { DialogProvider } from "../contexts/DialogContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import "../styles.css";

const queryClient = new QueryClient();

export const Route = createRootRoute({
	component: RootComponent,
});

function RootComponent() {
	return (
		<ThemeProvider>
			<Header />
			<QueryClientProvider client={queryClient}>
				<DialogProvider>
					<Outlet />
				</DialogProvider>
			</QueryClientProvider>
			<TanStackDevtools
				plugins={[
					{
						name: "Tanstack Router",
						render: <TanStackRouterDevtoolsPanel />,
					},
				]}
			/>
		</ThemeProvider>
	);
}
