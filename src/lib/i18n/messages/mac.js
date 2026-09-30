// MAC Address Vendor Lookup (/mac).
export default {
	en: {
		metaDescription:
			'Find the vendor of a MAC address from the IEEE registries (MA-L, MA-M, MA-S), convert it to every notation and EUI-64, and see whether it is multicast, locally administered or randomized. Offline, in the browser.',
		description:
			'Paste one or more MAC addresses (or an OUI prefix) in any notation to get the manufacturer from the IEEE registries, every standard notation and the EUI-64 IPv6 interface ID, and to spot randomized private addresses. Everything runs locally: nothing leaves your browser.',
		inputHeading: 'MAC addresses',
		inputLabel: 'MAC addresses, one per line',
		accepted:
			'Accepts aa:bb:cc:dd:ee:ff, aa-bb-cc-dd-ee-ff, aabb.ccdd.eeff, 12 bare hex digits or a 6-digit OUI prefix. One address per line.',
		statusIdle: 'Results update as you type.',
		statusCount: {
			one: '{count} valid address',
			other: '{count} valid addresses'
		},
		resultsHeading: 'Results',
		empty: 'Enter a MAC address to look it up.',
		invalid: 'Not a valid MAC address or OUI prefix.',
		loadingVendors: 'Loading the IEEE vendor list…',
		vendorError: 'Could not load the vendor list: {message}',
		source:
			'Vendors from the IEEE Registration Authority public listings (MA-L, MA-M, MA-S), bundled with the site. The vendor is who bought the block: the device may be made by someone else or the address may have been changed.',
		updated: 'Vendor list dated {date}.',
		'row.vendor': 'Vendor',
		'row.assignment': 'IEEE assignment',
		'row.country': 'Registered country',
		'row.cast': 'Address type',
		'row.administration': 'Administration',
		assignment: '{registry} · {prefix} ({bits}-bit block)',
		notFound: 'Not in the IEEE registries (unassigned or not public).',
		noVendorLocal: 'None: locally administered addresses are not assigned by the IEEE.',
		private: 'Private (the owner asked the IEEE not to publish it)',
		unicast: 'Unicast',
		multicast: 'Multicast (group address)',
		broadcast: 'Broadcast',
		universal: 'Universally administered (burned-in by the vendor)',
		local: 'Locally administered',
		localNote:
			'Locally administered: the address was set by software, not by the vendor. On phones and laptops this usually means a randomized private MAC (iOS, Android, Windows and macOS Wi-Fi privacy), which changes per network and cannot identify the device or its vendor. Virtual machines, containers and VPN adapters also use such addresses.',
		multicastNote:
			'Multicast addresses are destinations for groups of devices (for example 01:00:5E for IPv4 multicast, 33:33 for IPv6): they never belong to a single device.',
		prefixNote: 'Only the OUI prefix was given: the lookup uses the MA-L registry only.',
		formatsHeading: 'Notations',
		'format.colon': 'Colon (IEEE)',
		'format.colonLower': 'Colon, lowercase',
		'format.hyphen': 'Hyphen (Windows)',
		'format.cisco': 'Dotted (Cisco)',
		'format.bare': 'Bare',
		'format.eui64': 'EUI-64 interface ID',
		'format.linkLocal': 'IPv6 link-local (SLAAC)',
		eui64Note:
			'Interface ID used by SLAAC without privacy extensions: seeing it in an IPv6 address reveals this MAC.',
		copyFormat: 'Copy {format}',
		pivotHeading: 'Pivot',
		googleSearch: 'Search this address on Google',
		googleVendor: 'Search the vendor on Google',
		'table.mac': 'Address',
		'table.vendor': 'Vendor',
		'table.flags': 'Flags',
		'flag.local': 'local',
		'flag.multicast': 'multicast',
		'flag.broadcast': 'broadcast'
	},
	it: {
		metaDescription:
			'Trova il produttore di un indirizzo MAC dai registri IEEE (MA-L, MA-M, MA-S), convertilo in tutte le notazioni e in EUI-64 e scopri se è multicast, amministrato localmente o casuale. Offline, nel browser.',
		description:
			'Incolla uno o più indirizzi MAC (o un prefisso OUI) in qualsiasi notazione per ottenere il produttore dai registri IEEE, tutte le notazioni standard e l’interface ID EUI-64 IPv6, e per riconoscere gli indirizzi privati casuali. Tutto avviene in locale: nulla lascia il tuo browser.',
		inputHeading: 'Indirizzi MAC',
		inputLabel: 'Indirizzi MAC, uno per riga',
		accepted:
			'Accetta aa:bb:cc:dd:ee:ff, aa-bb-cc-dd-ee-ff, aabb.ccdd.eeff, 12 cifre esadecimali senza separatori o un prefisso OUI di 6 cifre. Un indirizzo per riga.',
		statusIdle: 'I risultati si aggiornano mentre scrivi.',
		statusCount: {
			one: '{count} indirizzo valido',
			other: '{count} indirizzi validi'
		},
		resultsHeading: 'Risultati',
		empty: 'Inserisci un indirizzo MAC da cercare.',
		invalid: 'Non è un indirizzo MAC o un prefisso OUI valido.',
		loadingVendors: 'Caricamento dell’elenco dei produttori IEEE…',
		vendorError: 'Impossibile caricare l’elenco dei produttori: {message}',
		source:
			'Produttori dagli elenchi pubblici della IEEE Registration Authority (MA-L, MA-M, MA-S), inclusi nel sito. Il produttore è chi ha acquistato il blocco: il dispositivo può essere fabbricato da altri o l’indirizzo può essere stato cambiato.',
		updated: 'Elenco dei produttori del {date}.',
		'row.vendor': 'Produttore',
		'row.assignment': 'Assegnazione IEEE',
		'row.country': 'Paese di registrazione',
		'row.cast': 'Tipo di indirizzo',
		'row.administration': 'Amministrazione',
		assignment: '{registry} · {prefix} (blocco da {bits} bit)',
		notFound: 'Non presente nei registri IEEE (non assegnato o non pubblico).',
		noVendorLocal: 'Nessuno: gli indirizzi amministrati localmente non sono assegnati dalla IEEE.',
		private: 'Privato (il titolare ha chiesto alla IEEE di non pubblicarlo)',
		unicast: 'Unicast',
		multicast: 'Multicast (indirizzo di gruppo)',
		broadcast: 'Broadcast',
		universal: 'Amministrato universalmente (impostato dal produttore)',
		local: 'Amministrato localmente',
		localNote:
			'Amministrato localmente: l’indirizzo è stato impostato via software, non dal produttore. Su telefoni e portatili di solito indica un MAC privato casuale (privacy Wi-Fi di iOS, Android, Windows e macOS), che cambia a ogni rete e non può identificare il dispositivo né il produttore. Anche macchine virtuali, container e adattatori VPN usano questi indirizzi.',
		multicastNote:
			'Gli indirizzi multicast sono destinazioni per gruppi di dispositivi (per esempio 01:00:5E per il multicast IPv4, 33:33 per IPv6): non appartengono mai a un singolo dispositivo.',
		prefixNote: 'È stato indicato solo il prefisso OUI: la ricerca usa solo il registro MA-L.',
		formatsHeading: 'Notazioni',
		'format.colon': 'Due punti (IEEE)',
		'format.colonLower': 'Due punti, minuscolo',
		'format.hyphen': 'Trattini (Windows)',
		'format.cisco': 'Punti (Cisco)',
		'format.bare': 'Senza separatori',
		'format.eui64': 'Interface ID EUI-64',
		'format.linkLocal': 'IPv6 link-local (SLAAC)',
		eui64Note:
			'Interface ID usato da SLAAC senza estensioni per la privacy: vederlo in un indirizzo IPv6 rivela questo MAC.',
		copyFormat: 'Copia {format}',
		pivotHeading: 'Pivot',
		googleSearch: 'Cerca questo indirizzo su Google',
		googleVendor: 'Cerca il produttore su Google',
		'table.mac': 'Indirizzo',
		'table.vendor': 'Produttore',
		'table.flags': 'Flag',
		'flag.local': 'locale',
		'flag.multicast': 'multicast',
		'flag.broadcast': 'broadcast'
	},
	fr: {
		metaDescription:
			'Trouvez le fabricant d’une adresse MAC dans les registres IEEE (MA-L, MA-M, MA-S), convertissez-la dans toutes les notations et en EUI-64, et voyez si elle est multicast, administrée localement ou aléatoire. Hors ligne, dans le navigateur.',
		description:
			'Collez une ou plusieurs adresses MAC (ou un préfixe OUI) dans n’importe quelle notation pour obtenir le fabricant d’après les registres IEEE, toutes les notations standard et l’identifiant d’interface EUI-64 IPv6, et repérer les adresses privées aléatoires. Tout s’exécute localement : rien ne quitte votre navigateur.',
		inputHeading: 'Adresses MAC',
		inputLabel: 'Adresses MAC, une par ligne',
		accepted:
			'Accepte aa:bb:cc:dd:ee:ff, aa-bb-cc-dd-ee-ff, aabb.ccdd.eeff, 12 chiffres hexadécimaux sans séparateur ou un préfixe OUI de 6 chiffres. Une adresse par ligne.',
		statusIdle: 'Les résultats se mettent à jour pendant la saisie.',
		statusCount: {
			one: '{count} adresse valide',
			other: '{count} adresses valides'
		},
		resultsHeading: 'Résultats',
		empty: 'Saisissez une adresse MAC à rechercher.',
		invalid: 'Ce n’est pas une adresse MAC ou un préfixe OUI valide.',
		loadingVendors: 'Chargement de la liste des fabricants IEEE…',
		vendorError: 'Impossible de charger la liste des fabricants : {message}',
		source:
			'Fabricants issus des listes publiques de l’IEEE Registration Authority (MA-L, MA-M, MA-S), incluses dans le site. Le fabricant est celui qui a acheté le bloc : l’appareil peut être fabriqué par un autre ou l’adresse peut avoir été modifiée.',
		updated: 'Liste des fabricants du {date}.',
		'row.vendor': 'Fabricant',
		'row.assignment': 'Attribution IEEE',
		'row.country': 'Pays d’enregistrement',
		'row.cast': 'Type d’adresse',
		'row.administration': 'Administration',
		assignment: '{registry} · {prefix} (bloc de {bits} bits)',
		notFound: 'Absent des registres IEEE (non attribué ou non public).',
		noVendorLocal:
			'Aucun : les adresses administrées localement ne sont pas attribuées par l’IEEE.',
		private: 'Privé (le titulaire a demandé à l’IEEE de ne pas le publier)',
		unicast: 'Unicast',
		multicast: 'Multicast (adresse de groupe)',
		broadcast: 'Broadcast',
		universal: 'Administrée universellement (gravée par le fabricant)',
		local: 'Administrée localement',
		localNote:
			'Administrée localement : l’adresse a été définie par logiciel, pas par le fabricant. Sur les téléphones et ordinateurs portables, cela indique généralement une adresse MAC privée aléatoire (confidentialité Wi-Fi d’iOS, Android, Windows et macOS), qui change selon le réseau et ne permet d’identifier ni l’appareil ni son fabricant. Les machines virtuelles, conteneurs et adaptateurs VPN utilisent aussi ces adresses.',
		multicastNote:
			'Les adresses multicast sont des destinations pour des groupes d’appareils (par exemple 01:00:5E pour le multicast IPv4, 33:33 pour IPv6) : elles n’appartiennent jamais à un seul appareil.',
		prefixNote:
			'Seul le préfixe OUI a été fourni : la recherche utilise uniquement le registre MA-L.',
		formatsHeading: 'Notations',
		'format.colon': 'Deux-points (IEEE)',
		'format.colonLower': 'Deux-points, minuscules',
		'format.hyphen': 'Tirets (Windows)',
		'format.cisco': 'Points (Cisco)',
		'format.bare': 'Sans séparateur',
		'format.eui64': 'Identifiant d’interface EUI-64',
		'format.linkLocal': 'IPv6 lien local (SLAAC)',
		eui64Note:
			'Identifiant d’interface utilisé par SLAAC sans extensions de confidentialité : le voir dans une adresse IPv6 révèle cette adresse MAC.',
		copyFormat: 'Copier {format}',
		pivotHeading: 'Pivot',
		googleSearch: 'Rechercher cette adresse sur Google',
		googleVendor: 'Rechercher le fabricant sur Google',
		'table.mac': 'Adresse',
		'table.vendor': 'Fabricant',
		'table.flags': 'Indicateurs',
		'flag.local': 'locale',
		'flag.multicast': 'multicast',
		'flag.broadcast': 'broadcast'
	}
};
