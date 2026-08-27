<script lang="ts">
	import HouseIcon from '@lucide/svelte/icons/house';
	import InboxIcon from '@lucide/svelte/icons/inbox';
	import FolderOpenIcon from '@lucide/svelte/icons/folder-open';
	import UsersIcon from '@lucide/svelte/icons/users';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import Section from '$lib/demo/section.svelte';
	import Row from '$lib/demo/row.svelte';

	let railOpen = $state(true);
	let projectsOpen = $state(true);
	let active = $state('posteingang');
	let activeProject = $state('quartalsabschluss');
</script>

<svelte:head><title>Sidebar · alrein-ui</title></svelte:head>

<header class="mb-8">
	<h1 class="cn-font-heading text-xl font-medium">Sidebar</h1>
	<p class="mt-2 max-w-3xl text-sm text-muted-foreground">
		Striktes Superset der shadcn-svelte-Sidebar — alle 23 Teilkomponenten unverändert exportiert,
		und <code>sidebar.types.ts</code> behauptet das zur Übersetzungszeit. Neu sind
		<code>variant="ghost"</code>, das Aufklappen der Untermenüs aus A21 und ein gemeinsamer
		Indikator auf <code>MorphIndicator</code> (A18).
	</p>
	<p class="mt-2 max-w-3xl text-sm text-muted-foreground">
		Die Demos unten stecken in einem eigenen <code>contain: layout</code>-Kasten, damit das
		<code>position: fixed</code> der Schiene an diesem Kasten hängt statt am Fenster. Das ist die
		Demo-Bühne, nicht Teil der Komponente.
	</p>
</header>

<Section
	title="Die Schiene klappt zusammen"
	note="256 px → 48 px. Das ist die zweite A16-Ausnahme (Zeile 21 der Layoutliste): das Zusammenklappen IST die Layoutänderung, es gibt kein Transform, das „die Hülle ist jetzt schmal und der Inhalt beginnt dort“ ausdrückt. Der Überschwinger der Vorlage (1.4, im gradient-Skin 1.8) ist abgelehnt — eine hüpfende Anwendungshülle schiebt den Seiteninhalt zweimal, und genau das nennt §2 den „langsam und betrunken“-Fall. Statt duration-200 ease-linear läuft sie auf duration-slow ease-fx-out."
>
	<Row label="Zustand">
		<button
			type="button"
			class="rounded-md border px-2.5 py-1 text-xs transition-colors duration-fast ease-fx-out hover:bg-muted"
			onclick={() => (railOpen = !railOpen)}
		>
			{railOpen ? 'Einklappen' : 'Ausklappen'}
		</button>
		<span class="text-xs text-muted-foreground">oder ⌘B / Strg+B, oder der Trigger im Kopf</span>
	</Row>

	<div class="relative h-[26rem] overflow-hidden rounded-lg border [contain:layout]">
		<Sidebar.Provider bind:open={railOpen} class="min-h-full">
			<Sidebar.Root collapsible="icon">
				<Sidebar.Header>
					<div class="flex items-center gap-2 px-2 py-1">
						<div class="size-6 shrink-0 rounded-md bg-primary"></div>
						<span class="truncate text-sm font-medium group-data-[collapsible=icon]:hidden">
							Hubris
						</span>
					</div>
				</Sidebar.Header>
				<Sidebar.Content>
					<Sidebar.Group>
						<Sidebar.GroupLabel>Navigation</Sidebar.GroupLabel>
						<Sidebar.GroupContent>
							<Sidebar.Menu indicator>
								<Sidebar.MenuItem>
									<Sidebar.MenuButton
										isActive={active === 'start'}
										tooltipContent="Start"
										onclick={() => (active = 'start')}
									>
										<HouseIcon />
										<span>Start</span>
									</Sidebar.MenuButton>
								</Sidebar.MenuItem>
								<Sidebar.MenuItem>
									<Sidebar.MenuButton
										isActive={active === 'posteingang'}
										tooltipContent="Posteingang"
										onclick={() => (active = 'posteingang')}
									>
										<InboxIcon />
										<span>Posteingang</span>
									</Sidebar.MenuButton>
									<Sidebar.MenuBadge>7</Sidebar.MenuBadge>
								</Sidebar.MenuItem>
								<Sidebar.MenuItem>
									<Sidebar.MenuButton
										isActive={active === 'projekte'}
										tooltipContent="Projekte"
										aria-expanded={projectsOpen}
										aria-controls="sb-projekte"
										onclick={() => {
											active = 'projekte';
											projectsOpen = !projectsOpen;
										}}
									>
										<FolderOpenIcon />
										<span>Projekte</span>
										<ChevronRightIcon
											class="ml-auto transition-[rotate] duration-slow ease-fx-out group-aria-expanded/menu-button:rotate-90"
										/>
									</Sidebar.MenuButton>
									<Sidebar.MenuSub id="sb-projekte" open={projectsOpen}>
										<Sidebar.MenuSubItem>
											<Sidebar.MenuSubButton
												href="#quartalsabschluss"
												isActive={activeProject === 'quartalsabschluss'}
												onclick={() => (activeProject = 'quartalsabschluss')}
											>
												<span>Quartalsabschluss</span>
											</Sidebar.MenuSubButton>
										</Sidebar.MenuSubItem>
										<Sidebar.MenuSubItem>
											<Sidebar.MenuSubButton
												href="#migration"
												isActive={activeProject === 'migration'}
												onclick={() => (activeProject = 'migration')}
											>
												<span>Migration</span>
											</Sidebar.MenuSubButton>
										</Sidebar.MenuSubItem>
									</Sidebar.MenuSub>
								</Sidebar.MenuItem>
								<Sidebar.MenuItem>
									<Sidebar.MenuButton
										isActive={active === 'team'}
										tooltipContent="Team"
										onclick={() => (active = 'team')}
									>
										<UsersIcon />
										<span>Team</span>
									</Sidebar.MenuButton>
								</Sidebar.MenuItem>
							</Sidebar.Menu>
						</Sidebar.GroupContent>
					</Sidebar.Group>
				</Sidebar.Content>
				<Sidebar.Footer>
					<Sidebar.Menu>
						<Sidebar.MenuItem>
							<Sidebar.MenuButton tooltipContent="Einstellungen">
								<SettingsIcon />
								<span>Einstellungen</span>
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
					</Sidebar.Menu>
				</Sidebar.Footer>
			</Sidebar.Root>
			<Sidebar.Inset class="min-h-full">
				<header class="flex h-12 items-center gap-2 border-b px-3">
					<Sidebar.Trigger />
					<span class="text-sm font-medium">Posteingang</span>
				</header>
				<div class="p-4 text-sm text-muted-foreground">
					Der Inhaltsbereich rückt mit. Beim Einklappen bleibt der eingeklappte Beschriftungstext
					über den Tooltip der Menüschaltfläche erreichbar — bits-ui, nicht selbst gebaut.
				</div>
			</Sidebar.Inset>
		</Sidebar.Provider>
	</div>
</Section>

<Section
	title="Untermenüs klappen mit fx-collapse auf"
	note="Zeile 26 der Layoutliste, die zweite 0fr ↔ 1fr-Stelle. Beide Kurven der Vorlage fallen weg: das Öffnen mit Überschwinger (1.8) öffnet die Liste höher als ihre eigenen Einträge, und das Schließen mit Antizipation (−0.6) zieht sie erst noch ein Stück auf. Geschlossen ist die Liste visibility: hidden — also aus dem Tab-Fokus und aus dem Barrierefreiheitsbaum — und zwar ohne Timer und ohne Listener, weil visibility genau am Ende der schließenden Transition umspringt."
>
	<Row label="Auslöser">
		<span class="text-xs text-muted-foreground">
			„Projekte“ oben aufklappen und zuklappen. Der Auslöser ist eine echte
			<code>&lt;button aria-expanded aria-controls&gt;</code> — die native Auskappung, ohne eine
			Zeile Tastaturbehandlung. bits-ui <code>Collapsible</code> ist die Alternative und wurde
			geprüft; die Komponente besitzt bewusst nur die Animation.
		</span>
	</Row>
</Section>

<Section
	title='variant="ghost"'
	note="Der vierte Wert in der Upstream-Aufzählung und die einzige Zelle, die §3.4 der Sidebar gibt: keine Kante, keine Füllung. Für eine Anwendung, die ihren Hintergrund selbst malt. Der Rand wird nicht überschrieben, sondern gar nicht erst ausgegeben — border-e-0 würde gegen group-data-[side=left]:border-e auf Spezifität verlieren, und das zurückzugewinnen hieße, die Kaskade mit einer Wichtig-Markierung zu erzwingen — genau das, was F17 verbietet."
>
	<div class="relative h-64 overflow-hidden rounded-lg border bg-muted/30 [contain:layout]">
		<Sidebar.Provider open class="min-h-full">
			<Sidebar.Root variant="ghost" collapsible="none" class="w-56">
				<Sidebar.Content>
					<Sidebar.Group>
						<Sidebar.GroupLabel>Ghost</Sidebar.GroupLabel>
						<Sidebar.GroupContent>
							<Sidebar.Menu>
								<Sidebar.MenuItem>
									<Sidebar.MenuButton isActive>
										<HouseIcon />
										<span>Start</span>
									</Sidebar.MenuButton>
								</Sidebar.MenuItem>
								<Sidebar.MenuItem>
									<Sidebar.MenuButton>
										<InboxIcon />
										<span>Posteingang</span>
									</Sidebar.MenuButton>
								</Sidebar.MenuItem>
							</Sidebar.Menu>
						</Sidebar.GroupContent>
					</Sidebar.Group>
				</Sidebar.Content>
			</Sidebar.Root>
			<Sidebar.Inset class="min-h-full bg-transparent">
				<div class="p-4 text-sm text-muted-foreground">
					Keine Panel-Füllung, keine Kante — die Fläche der Seite trägt durch.
				</div>
			</Sidebar.Inset>
		</Sidebar.Provider>
	</div>
</Section>

<Section
	title="Der Indikator ist ein Transform, kein wanderndes Kästchen"
	note="A18: MorphIndicator hat Tabs, Pagination und Sidebar als Abnehmer. Er setzt sich sofort auf sein neues Kästchen und animiert dann transform vom invertierten alten zurück — width, height, top und left werden nie animiert. In einer senkrechten Liste gleich hoher Zeilen ändert sich ohnehin nur translateY, weshalb der Auszug die Sidebar als „vollständig kompatibel, ohne Vorbehalte“ führt. opt-in über <code>indicator</code>: ein Indikator behauptet, welcher Eintrag aktuell ist, und das soll keine Komponente von sich aus tun."
>
	<ul class="max-w-3xl list-disc space-y-2 pl-5 text-sm text-muted-foreground">
		<li>
			<strong class="text-foreground">Der Rückfall im eingeklappten Zustand</strong>, wörtlich aus
			dem rail-Skin übernommen: ist die Schiene schmal, zielt der Indikator auf das sichtbare
			Elternelement statt auf das verborgene Kind. Ein FLIP-Indikator auf einem verborgenen Element
			misst ein Nullkästchen und fliegt nach 0,0.
		</li>
		<li>
			<strong class="text-foreground">Das wandernde Hover-Licht der Vorlage</strong> folgt dem
			Zeiger, nicht der Auswahl. Abgelehnt: das wäre ein zeigerverfolgter Effekt an einer
			Komponente, der §3.4 nur <code>ghost</code> gibt.
		</li>
		<li>
			<strong class="text-foreground">Animiertes padding-left am aktiven Eintrag</strong> (Zeile 22)
			und <strong class="text-foreground">margin-right am Abzeichen</strong> (Zeile 23) sind
			abgelehnt. Upstream rückt gar nicht ein, also gibt es nichts umzuformulieren —
			<code>padding</code> ist zusätzlich aus der Transition der Menüschaltfläche entfernt.
		</li>
	</ul>
</Section>

<Section
	title="Der eingeklappte Zustand überlebt einen Neuladen — A24"
	note="Die Vorlage speichert nichts: in keiner der sieben Phase-3-Komponenten gibt es localStorage oder ein Cookie, also klappt eine eingeklappte Schiene beim ersten Bild nach dem Neuladen kurz auf. shadcns Sidebar hat den Mechanismus bereits, und er bleibt unverändert: Sidebar.Provider schreibt sidebar_state in ein Cookie mit sieben Tagen Laufzeit. Gelesen wird es beim Verbraucher, denn nur dessen Server sieht die Anfrage — genau das macht es blitzfrei. Diese Doku-Seite läuft auf adapter-static und hat keinen Server, zeigt also die Verdrahtung statt der Persistenz."
>
	<pre class="overflow-x-auto rounded-lg border bg-muted/40 p-4 text-xs"><code
			>{`// +layout.server.ts  (beim Verbraucher, nicht in der Bibliothek)
export const load = ({ cookies }) => ({
  sidebarOpen: cookies.get('sidebar_state') !== 'false'
});

// +layout.svelte
<Sidebar.Provider open={data.sidebarOpen}>…</Sidebar.Provider>`}</code
		></pre>
</Section>

<Section
	title="Was ein Typfehler ist"
	note="§3.4 gibt der Sidebar ghost und sonst nichts. Die Vorlage legt einen Rand-Glow, die Nachbarlicht-Lampe, eine 2,6-s-Abtastlinie und eine 12-s-Verlaufsdrift darüber — keiner davon hat hier ein Prop, also kann keiner angefordert werden."
>
	<pre class="overflow-x-auto rounded-lg border bg-muted/40 p-4 text-xs"><code
			>{`<Sidebar.Root gradient />        ← kein Gradient
<Sidebar.Root glow />            ← der Rand-Glow ist abgelehnt (A20)
<Sidebar.Root shimmer />         ← Shimmer gehört zu Ladezuständen
<Sidebar.Root tilt />            ← Anwendungschrome kippt nicht
<Sidebar.Root magnet />          ← Magnet nie in der Chrome
<Sidebar.MenuButton glow />      ← ein Menüeintrag ist ein Gleicher unter Gleichen`}</code
		></pre>
</Section>
