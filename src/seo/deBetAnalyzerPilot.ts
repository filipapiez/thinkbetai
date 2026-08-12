export type LocalizedLongFormSection = {
  heading: string;
  body: string[];
  bullets?: string[];
};

export const DE_BET_ANALYZER_PATH = "/de/ki-wettanalyse";

export const deBetAnalyzerPilot = {
  eyebrow: "Deutscher Leitfaden zur KI-Wettanalyse",
  heroHeadline: "KI-Wettanalyse: Quoten, Wahrscheinlichkeit und Risiko richtig bewerten",
  heroSubheadline:
    "Dieser ausführliche deutsche Leitfaden zeigt, wie eine KI-Wettanalyse einen Wettschein strukturiert prüft, welche Daten wirklich zählen und warum eine hohe Modellwahrscheinlichkeit allein noch keine gute Wette ergibt.",
  sections: [
    {
      heading: "Was eine KI-Wettanalyse tatsächlich leistet",
      body: [
        "Eine KI-Wettanalyse ist kein digitaler Tippgeber, der ein Ergebnis sicher vorhersagt. Ihr sinnvoller Zweck besteht darin, Informationen zu ordnen: aktuelle Quote, daraus abgeleitete Marktannahme, geschätzte Eintrittswahrscheinlichkeit, verfügbare Team- oder Spielerdaten und bekannte Unsicherheiten. Das Ergebnis sollte keine Aufforderung zum Einsatz sein, sondern eine nachvollziehbare Entscheidungshilfe. Ein guter Bericht erklärt deshalb nicht nur, welche Seite eines Marktes statistisch interessanter wirkt, sondern auch, wie empfindlich die Einschätzung auf neue Nachrichten, eine andere Quote oder unvollständige Daten reagiert.",
        "Für Nutzer in Deutschland ist besonders wichtig, Analyse und Glücksspiel klar zu trennen. ThinkBetAI führt kein Wettkonto, nimmt keine Einsätze an und garantiert weder Gewinne noch eine bestimmte Trefferquote für den nächsten Tipp. Die Plattform kann helfen, eine Behauptung wie „Mannschaft A ist heute klarer Favorit“ in überprüfbare Bestandteile zu zerlegen. Dazu gehören die implizite Wahrscheinlichkeit der Quote, die Modellschätzung, die Preisdifferenz zwischen beiden Werten und konkrete Risikofaktoren. Diese Struktur kann impulsive Entscheidungen bremsen, ersetzt aber weder eigenes Urteil noch persönliche Einsatzgrenzen.",
      ],
      bullets: [
        "Die Analyse bewertet Preis und Wahrscheinlichkeit gemeinsam.",
        "Sie macht Annahmen und Unsicherheiten sichtbar.",
        "Sie kann ausdrücklich zu Abwarten oder Verzichten führen.",
        "Sie garantiert kein Ergebnis und keine Rendite.",
      ],
    },
    {
      heading: "Warum die Quote wichtiger ist als ein bloßer Sieger-Tipp",
      body: [
        "Sportprognosen werden häufig auf die Frage reduziert, wer gewinnt. Für eine Wettentscheidung reicht das nicht. Eine Mannschaft kann mit hoher Wahrscheinlichkeit gewinnen und trotzdem zu einer unattraktiven Quote angeboten werden. Umgekehrt kann ein Außenseiter verlieren und dennoch zu einem Preis angeboten sein, der im Verhältnis zur realistischen Chance interessant erscheint. Die entscheidende Frage lautet deshalb nicht nur „Was passiert wahrscheinlich?“, sondern „Ist die angebotene Quote im Verhältnis zur geschätzten Wahrscheinlichkeit angemessen?“.",
        "Bei Dezimalquoten lässt sich die einfache implizite Wahrscheinlichkeit mit 1 geteilt durch die Quote berechnen. Eine Quote von 2,00 entspricht vor Bereinigung der Buchmachermarge 50 Prozent. Eine Quote von 1,50 entspricht ungefähr 66,7 Prozent, eine Quote von 3,00 ungefähr 33,3 Prozent. Diese Werte sind keine neutralen Vorhersagen, weil der Markt eine Marge enthält. Eine seriöse Analyse nennt diese Einschränkung und behandelt die Quote als Preis, nicht als Beweis. Erst der Vergleich mit einer unabhängig geschätzten fairen Wahrscheinlichkeit schafft einen sinnvollen Bewertungsrahmen.",
      ],
    },
    {
      heading: "Implizite Wahrscheinlichkeit, faire Quote und Buchmachermarge",
      body: [
        "Die implizite Wahrscheinlichkeit übersetzt eine Quote in eine leicht verständliche Prozentzahl. Bei einem Zwei-Wege-Markt addieren sich die impliziten Wahrscheinlichkeiten beider Seiten normalerweise auf mehr als 100 Prozent. Diese Differenz ist ein vereinfachter Hinweis auf die eingebaute Marge. Wer nur eine einzelne Quote betrachtet, kann deshalb den Marktpreis mit einer objektiven Einschätzung verwechseln. Eine KI-Wettanalyse sollte entweder die Marge bereinigen oder zumindest deutlich erklären, dass die Rohwahrscheinlichkeit nicht der neutralen Marktschätzung entspricht.",
        "Die faire Quote ist der Kehrwert der eigenen Modellwahrscheinlichkeit. Schätzt ein Modell die Chance eines Ereignisses auf 55 Prozent, liegt die theoretische faire Dezimalquote bei etwa 1,82. Wird am Markt 1,95 angeboten, besteht auf dem Papier ein Preisvorteil. Wird nur 1,70 angeboten, bezahlt der Nutzer mehr, als die Modellschätzung rechtfertigt. Diese Rechnung ist jedoch nur so gut wie die zugrunde liegenden Daten und Annahmen. Ein scheinbarer Vorteil kann vollständig verschwinden, wenn eine Verletzung falsch bewertet, die Aufstellung noch unbekannt oder die Stichprobe zu klein ist.",
        "ThinkBetAI sollte diese Größen nebeneinander darstellen: angebotene Quote, Break-even-Wahrscheinlichkeit, Modellwahrscheinlichkeit, faire Quote und eine verständliche Risikonotiz. Dadurch kann ein Nutzer erkennen, ob ein positives Signal aus einer echten Preisdifferenz oder nur aus einer hohen erwarteten Siegchance entsteht. Gerade Favoriten wirken psychologisch sicher, obwohl ihr Preis oft wenig Fehlertoleranz lässt.",
      ],
    },
    {
      heading: "Erwartungswert verständlich einordnen",
      body: [
        "Der erwartete Wert, häufig als EV bezeichnet, beschreibt den theoretischen Durchschnitt eines wiederholten Einsatzes unter identischen Annahmen. Ein positiver EV bedeutet nicht, dass die konkrete Wette gewinnt. Er bedeutet lediglich, dass Modellwahrscheinlichkeit und Marktpreis langfristig ein günstiges Verhältnis vermuten lassen. In einer einzelnen Partie dominiert weiterhin die Varianz. Ein Ball kann den Pfosten treffen, ein Spieler kann früh verletzt ausfallen oder ein Favorit kann trotz guter Ausgangslage verlieren.",
        "Ein praktisches Beispiel: Ein Markt bietet Quote 2,10, während das Modell eine Eintrittswahrscheinlichkeit von 50 Prozent schätzt. Der theoretische Rückfluss pro Einheit beträgt 0,50 mal 2,10, also 1,05 Einheiten. Nach Abzug des Einsatzes ergibt sich ein modellierter Vorteil von 0,05 Einheiten beziehungsweise fünf Prozent. Diese Zahl darf nicht isoliert dargestellt werden. Die Analyse muss erklären, wie stabil die 50-Prozent-Schätzung ist, welche Daten fehlen und wie schnell sich der Wert bei einer Quotenbewegung verändert.",
        "Ein verantwortungsvoller Bericht trennt deshalb drei Ebenen: mathematisches Signal, Datenqualität und praktisches Risiko. Ist nur die erste Ebene positiv, sollte das Ergebnis nicht automatisch als Tipp erscheinen. Bei ungeklärten Verletzungen, dünnen Märkten oder stark schwankenden Spielerrollen kann „kein Einsatz“ die sinnvollste Analyseausgabe sein.",
      ],
    },
    {
      heading: "So prüft ThinkBetAI einen Wettschein Schritt für Schritt",
      body: [
        "Der Analyseprozess beginnt mit dem exakten Markt. Sportart, Liga, Begegnung, Auswahl, Linie und Quote müssen eindeutig sein. „Bayern gewinnt“ ist weniger präzise als „Bayern Geldlinie zu Quote 1,72“. Bei Spreads und Totals gehört außerdem die konkrete Linie dazu. Bei Spielerwetten sind Spieler, Statistik, Schwelle und Over- oder Under-Seite notwendig. Ohne diese Angaben kann keine belastbare Preisprüfung stattfinden.",
        "Danach wird die Quote in eine Break-even-Wahrscheinlichkeit übersetzt und mit der Modellschätzung verglichen. Anschließend folgt die Kontextprüfung: Verletzungen, erwartete Aufstellung, Terminbelastung, Heimvorteil, Matchup, Wetter, Marktliquidität und Zeitpunkt der Daten. Je nach Sport unterscheiden sich die Gewichte. Abschließend sollte die Analyse eine Konfidenzspanne, die wichtigsten Gegenargumente und ein klares Pass-Kriterium nennen. Ein Nutzer muss verstehen, unter welcher Quote oder nach welcher Nachricht die ursprüngliche Einschätzung nicht mehr gilt.",
      ],
      bullets: [
        "Markt, Linie und Quote eindeutig erfassen.",
        "Break-even-Wahrscheinlichkeit berechnen.",
        "Modellwahrscheinlichkeit und faire Quote vergleichen.",
        "Aktuelle Nachrichten und sportartspezifische Faktoren prüfen.",
        "Risiko, Gegenargumente und Pass-Kriterien dokumentieren.",
      ],
    },
    {
      heading: "Welche Daten in eine seriöse Analyse gehören",
      body: [
        "Ein Modell kann nur Informationen auswerten, die verfügbar, aktuell und korrekt zugeordnet sind. Grunddaten wie Resultate, Tore, Punkte oder Siege reichen selten aus. Je nach Markt sind effizientere Kennzahlen notwendig: erwartete Tore im Fußball, Pace und Usage im Basketball, Pitcher- und Bullpen-Werte im Baseball oder Snap-Anteile und Verletzungsstatus im American Football. Auch die Stärke der Gegner und der Zeitraum der Beobachtung beeinflussen, ob ein Trend aussagekräftig ist.",
        "Marktdaten bilden eine zweite Ebene. Eröffnungsquote, aktuelle Quote, Veränderung über mehrere Anbieter und Zeitpunkt der Bewegung können zeigen, ob neue Informationen bereits eingepreist wurden. Eine Bewegung ist aber kein automatisches Qualitätssignal. Sie kann durch geringe Liquidität, Nachrichten, Limits oder einseitige Nachfrage entstehen. Die Analyse sollte eine Bewegung beschreiben, ohne eine unbelegte Ursache als Tatsache darzustellen.",
        "Die dritte Ebene ist Datenqualität. Fehlen Aufstellungen? Ist ein Spieler fraglich? Stammt die Quote aus einem liquiden Hauptmarkt oder aus einem Nebenmarkt mit geringen Limits? Wie groß ist die Stichprobe? Ein guter Bericht nennt diese Einschränkungen sichtbar. Je größer die Unsicherheit, desto breiter sollte die Konfidenzspanne und desto zurückhaltender die Schlussfolgerung sein.",
      ],
    },
    {
      heading: "Fußball: Unentschieden, Aufstellungen und Spielstil",
      body: [
        "Im Fußball darf eine KI-Wettanalyse die Unentschieden-Wahrscheinlichkeit nicht unterschätzen. Ein Team kann spielerisch überlegen sein, ohne eine Geldlinie oder einen Drei-Wege-Preis attraktiv zu machen. Erwartete Tore, Schussqualität, Ballgewinne, Standardstärke, Torwartleistung und Heimvorteil können helfen, die Begegnung zu strukturieren. Dennoch bleiben Aufstellungen und taktische Ausrichtung entscheidend. Ein Favorit, der mehrere Stammspieler schont, ist ein anderer Markt als derselbe Verein in Bestbesetzung.",
        "Bei Totals und Beide-Teams-treffen-Märkten sollte die Analyse nicht nur historische Endstände zählen. Tempo, Chancenqualität, Pressing, Spielstandabhängigkeit und Wettbewerbssituation verändern das Profil. Ein Rückspiel mit Vorsprung kann beispielsweise vorsichtiger verlaufen als ein gewöhnliches Ligaspiel. Der Bericht sollte solche Bedingungen erklären und nicht den Eindruck erwecken, ein Durchschnittswert sei eine vollständige Prognose.",
      ],
    },
    {
      heading: "Basketball: Pace, Einsatzzeit und kurzfristige Nachrichten",
      body: [
        "Basketballmärkte reagieren besonders schnell auf Aufstellungen, Pausenmanagement und kurzfristige Verletzungen. Für Moneyline, Spread und Total sind Pace, offensive und defensive Effizienz, Rebound-Stärke, Ballverluste und Dreipunktprofil relevante Ausgangspunkte. Die Werte müssen jedoch an Gegner und Lineup angepasst werden. Ein Team ohne primären Ballhandler kann seine Spielweise deutlich verändern, selbst wenn die Saisonstatistik weiterhin stark aussieht.",
        "Bei Spieler-Props sind erwartete Minuten, Usage, Startformation, Foulrisiko und potenzieller Blowout wichtig. Eine Saisonquote kann irreführend sein, wenn sich die Rolle erst vor wenigen Spielen geändert hat. Eine gute KI-Wettanalyse zeigt daher nicht nur einen Projektionwert, sondern auch, welche Minutenannahme dahintersteht und wie empfindlich das Ergebnis auf eine veränderte Rotation reagiert.",
      ],
    },
    {
      heading: "Tennis und Eishockey: Matchup statt bloßer Formkurve",
      body: [
        "Im Tennis beeinflussen Belag, Aufschlag- und Returnprofil, Reisesituation, körperliche Belastung und direkte Stilkonflikte die Einschätzung. Eine Siegesserie gegen schwächere Gegner ist nicht automatisch auf ein anderes Niveau oder einen anderen Belag übertragbar. Zusätzlich unterscheiden sich Abrechnungsregeln bei Aufgabe eines Spielers je nach Anbieter. Wer diese Regeln nicht prüft, kann selbst eine korrekte sportliche Einschätzung falsch bewerten.",
        "Im Eishockey spielen erwarteter Torhüter, Chancenqualität, Special Teams, Ruhezeiten und mögliche Verlängerungsregeln eine große Rolle. Moneyline und Drei-Wege-Markt sind nicht identisch. Eine Analyse muss deshalb genau benennen, ob Verlängerung und Penaltyschießen eingeschlossen sind. Kleine Stichproben bei Torhütern oder ungewöhnlich hohe Abschlussquoten sollten als Volatilitätsrisiko behandelt werden, nicht als stabiler Trend.",
      ],
    },
    {
      heading: "Moneyline, Spread, Total und Spieler-Props unterscheiden",
      body: [
        "Jeder Markttyp beantwortet eine andere Frage. Die Moneyline bewertet den Sieger, ein Spread die erwartete Differenz und ein Total die gemeinsame Produktion. Spieler-Props isolieren eine individuelle Leistung, die von Rolle, Einsatzzeit und Spielverlauf abhängt. Eine generische Erklärung für alle vier Märkte ist deshalb nicht ausreichend. Das Modell muss die relevanten Variablen und die konkrete Abrechnungsregel des Marktes berücksichtigen.",
        "Auch die Fehlerquellen unterscheiden sich. Bei einer Moneyline kann das Unentschieden oder die Verlängerungsregel entscheidend sein. Bei einem Spread ist die exakte Zahl wichtig, weil ein halber Punkt die Abrechnung verändert. Bei Totals können Tempo und Spielstandeffekte dominieren. Bei Props reichen wenige Minuten weniger oder eine taktische Rollenänderung, um die Projektion unbrauchbar zu machen. Die Analyse sollte diese Marktmechanik vor jeder Empfehlung erklären.",
      ],
    },
    {
      heading: "Kombiwetten und Korrelation richtig behandeln",
      body: [
        "Bei einer Kombiwette werden mehrere Bedingungen miteinander verknüpft. Die angezeigte Auszahlung wirkt attraktiv, doch die gemeinsame Eintrittswahrscheinlichkeit sinkt mit jedem zusätzlichen Teil. Besonders problematisch ist eine falsche Annahme von Unabhängigkeit. Zwei Auswahlen können positiv oder negativ korreliert sein. Wenn beispielsweise ein Quarterback viele Touchdown-Pässe erzielt, kann das mit bestimmten Receiver-Props zusammenhängen. Andere Kombinationen können sich gegenseitig widersprechen.",
        "Eine KI-Wettanalyse sollte jede Auswahl zunächst einzeln prüfen und anschließend die Beziehung zwischen den Teilen bewerten. Eine gute Einzelwette wird durch das Hinzufügen schwacher Teile nicht besser. Die Analyse muss auch zeigen, wie viel Marge sich über mehrere Beine summiert und warum eine hohe Auszahlung kein Qualitätsbeweis ist. Ein verantwortungsvolles Ergebnis kann empfehlen, eine Kombination zu verkürzen oder vollständig auf sie zu verzichten.",
      ],
    },
    {
      heading: "Line Movement und der Zeitpunkt einer Entscheidung",
      body: [
        "Eine Einschätzung gilt immer für einen bestimmten Preis. Wenn die Quote fällt, steigt die notwendige Break-even-Wahrscheinlichkeit. Ein Vorteil, der bei 2,05 bestand, kann bei 1,85 verschwunden sein. Deshalb sollte jede Analyse eine Mindestquote oder einen Preisbereich nennen. Ohne diese Grenze bleibt die Empfehlung selbst dann stehen, wenn ihre mathematische Grundlage nicht mehr existiert.",
        "Quotenbewegungen können außerdem neue Informationen widerspiegeln. Eine bestätigte Aufstellung, ein Torhüterwechsel oder eine Wetteränderung kann den Markt verschieben. Die Bewegung allein verrät jedoch nicht sicher, warum sie stattgefunden hat. ThinkBetAI sollte deshalb aktuelle Daten erneut prüfen, statt eine ältere Modellschätzung unverändert auf einen neuen Preis anzuwenden. Wer einen Bericht später liest, muss erkennen können, wann Quote und Datenstand erfasst wurden.",
      ],
    },
    {
      heading: "Konfidenz ist nicht dasselbe wie Wert",
      body: [
        "Eine hohe Konfidenz beschreibt idealerweise die Stabilität einer Modellschätzung, nicht die Höhe einer möglichen Auszahlung und auch keine Gewinnzusage. Ein Ereignis kann sehr wahrscheinlich sein, aber zu einer schlechten Quote angeboten werden. Umgekehrt kann ein Markt einen rechnerischen Vorteil zeigen, obwohl die Datensicherheit nur mittelmäßig ist. Deshalb sollten Konfidenz, erwarteter Wert und Risiko getrennt ausgewiesen werden.",
        "Eine sinnvolle Risikoklassifizierung berücksichtigt Datenaktualität, Stichprobengröße, Marktliquidität, Verletzungsunsicherheit und Empfindlichkeit gegenüber Quotenänderungen. Der Nutzer sollte sehen, ob eine Bewertung aufgrund stabiler Informationen oder aufgrund weniger Annahmen entsteht. Ein einzelner Prozentwert ohne Erklärung schafft falsche Präzision und kann zu übermäßigem Vertrauen führen.",
      ],
    },
    {
      heading: "Häufige Fehler bei der Nutzung von KI-Wettanalysen",
      body: [
        "Der häufigste Fehler ist, eine Modellwahrscheinlichkeit als sichere Prognose zu lesen. Weitere Fehler entstehen durch veraltete Quoten, ignorierte Verletzungen, fehlende Marktregeln und das unkritische Kombinieren mehrerer Auswahlen. Auch die Suche nach Bestätigung kann das Ergebnis verzerren: Wer bereits eine Lieblingsauswahl hat, achtet stärker auf positive Argumente und blendet Gegenargumente aus.",
        "Ein zweiter Fehler ist die Überbewertung kleiner Unterschiede. Eine Modellschätzung von 52 Prozent gegenüber einer Break-even-Wahrscheinlichkeit von 50 Prozent kann vollständig innerhalb des Modellfehlers liegen. Ohne Konfidenzspanne und Datenqualitätsprüfung wirkt der Vorteil präziser, als er ist. Ein dritter Fehler ist das Erhöhen des Einsatzes nach Verlusten. Kein Analysebericht rechtfertigt das Nachjagen vergangener Ergebnisse.",
      ],
      bullets: [
        "Keine Entscheidung mit einer alten Quote treffen.",
        "Konfidenz nie als Garantie interpretieren.",
        "Marktregeln und Abrechnung vorab prüfen.",
        "Keine Verluste durch höhere Einsätze zurückholen wollen.",
        "Bei unvollständigen Daten lieber warten oder verzichten.",
      ],
    },
    {
      heading: "Wann die richtige Analyse ausdrücklich Nein sagt",
      body: [
        "Ein gutes System muss nicht für jeden Wettschein eine positive Antwort erzeugen. Fehlt ein klarer Preisvorteil, ist der Markt nach einer Bewegung zu teuer oder sind entscheidende Nachrichten offen, sollte das Ergebnis „abwarten“ oder „kein Einsatz“ lauten. Diese Pass-Entscheidung ist kein Fehler des Produkts, sondern ein wichtiger Teil des Risikomanagements.",
        "Weitere Gründe für einen Verzicht sind geringe Marktliquidität, widersprüchliche Daten, eine extrem kleine Stichprobe oder eine Modellschätzung, die stark von einer einzigen Annahme abhängt. Auch persönliche Faktoren zählen: Wer unter Stress steht, Verluste zurückholen will oder die eigenen Limits bereits erreicht hat, sollte unabhängig von der Analyse nicht handeln. ThinkBetAI soll Forschung strukturieren, nicht Druck erzeugen.",
      ],
    },
    {
      heading: "Ein vollständiges Beispiel für eine Preisprüfung",
      body: [
        "Angenommen, ein Fußballmarkt bietet für die Heimmannschaft Quote 2,20. Die einfache Break-even-Wahrscheinlichkeit beträgt rund 45,5 Prozent. Ein Modell schätzt die Siegchance auf 49 Prozent und die Unentschieden-Wahrscheinlichkeit auf 28 Prozent. Die theoretische faire Quote für den Heimsieg läge bei ungefähr 2,04. Auf dem Papier besteht somit ein kleiner Preisunterschied zugunsten der angebotenen Quote.",
        "Nun folgt die Kontextprüfung. Der zentrale Innenverteidiger ist fraglich, die Aufstellung erscheint erst später und der Markt ist seit dem Morgen von 2,30 auf 2,20 gefallen. Wird der Spieler nicht eingesetzt, sinkt die Modellschätzung möglicherweise auf 46 Prozent. Bei einer weiteren Bewegung auf 2,05 steigt die Break-even-Wahrscheinlichkeit auf etwa 48,8 Prozent. Der ursprüngliche Vorteil wäre fast vollständig verschwunden. Eine seriöse Analyse würde deshalb keine zeitlose Empfehlung geben, sondern eine Bedingung formulieren: nur bei bestätigter Aufstellung und einer Quote oberhalb des definierten Mindestpreises weiter prüfen.",
        "Dieses Beispiel zeigt, warum die Kombination aus Preis, Wahrscheinlichkeit und Informationsstand wichtiger ist als ein einfacher Favoritenhinweis. Das Ergebnis kann sich ändern, obwohl die Begegnung dieselbe bleibt. Nutzer sollten daher vor jeder Entscheidung die aktuelle Quote erneut erfassen und den Bericht nicht als dauerhaft gültig behandeln.",
      ],
    },
    {
      heading: "Methodik, Transparenz und Grenzen des Modells",
      body: [
        "Vertrauen entsteht nicht durch selbstbewusste Sprache, sondern durch nachvollziehbare Methodik. Eine Analyse sollte offenlegen, welche Arten von Daten berücksichtigt werden, wann sie zuletzt aktualisiert wurden und welche Annahmen besonders wichtig sind. Sie sollte außerdem erklären, wie Modellwahrscheinlichkeit, faire Quote, EV und Risiko zusammenhängen. Nutzer müssen erkennen können, ob ein Ergebnis auf breiten Daten oder auf einer dünnen Informationslage beruht.",
        "Kein Modell kennt die Zukunft. Sport enthält Zufall, Messfehler und Ereignisse, die in historischen Daten nicht vollständig abgebildet sind. Modelle können außerdem durch veränderte Spielstile, neue Trainer, Rollenwechsel oder Datenlücken schlechter werden. ThinkBetAI sollte diese Grenzen nahe an der Analyse nennen und keine isolierte Trefferquote als Versprechen für kommende Ergebnisse verwenden.",
        "Zur Transparenz gehören auch Korrekturen und überprüfbare Leistungsangaben. Wenn historische Ergebnisse gezeigt werden, sollten Zeitraum, Auswahlkriterien, Quotenstand und Abrechnungsregeln definiert sein. Cherry-Picking einzelner Siegesserien vermittelt kein belastbares Bild. Der Nutzer sollte über Methodik, Track Record, redaktionelle Standards und verantwortungsvolle Nutzung weiterführende Informationen finden können.",
      ],
    },
    {
      heading: "Datenschutz und sichere Nutzung des Bet Analyzers",
      body: [
        "Wer einen Wettschein analysiert, sollte keine unnötigen persönlichen oder finanziellen Informationen eingeben. Für eine Marktprüfung reichen normalerweise Sportart, Begegnung, Auswahl, Linie und Quote. Zugangsdaten zu Wettkonten, vollständige Zahlungsinformationen oder vertrauliche Dokumente gehören nicht in ein Analysefeld. Die Datenschutzseite sollte erklären, welche Account- und Nutzungsdaten für Betrieb, Sicherheit und Support verarbeitet werden können.",
        "Ein Account kann Funktionen wie gespeicherte Analysen oder tiefere Produktabläufe ermöglichen, verändert aber nicht die Unsicherheit des Sports. Nutzer sollten sichere Passwörter verwenden, ihre Zugangsdaten nicht teilen und verdächtige Nachrichten ignorieren. ThinkBetAI ist kein Buchmacher und benötigt keinen Zugriff auf ein externes Wettkonto, um eine Quote mathematisch zu erklären.",
      ],
    },
    {
      heading: "Verantwortungsvolle Nutzung und persönliche Grenzen",
      body: [
        "Sportwetten sind mit finanziellem Risiko verbunden. Vor jeder Nutzung eines Analysewerkzeugs sollten Zeit-, Einsatz- und Verlustgrenzen feststehen. Diese Grenzen dürfen nicht aufgrund einer hohen Konfidenzanzeige, einer Siegesserie oder eines vermeintlich starken Vorteils erhöht werden. Geld für Miete, Rechnungen, Rücklagen oder andere notwendige Ausgaben gehört niemals in einen Einsatz.",
        "Warnzeichen sind unter anderem das Nachjagen von Verlusten, heimliches Spielen, geliehenes Geld, Stress, Konflikte und das Gefühl, nicht aufhören zu können. In diesen Situationen ist eine weitere Analyse nicht die richtige nächste Aktion. Nutzer sollten pausieren und lokale Hilfsangebote oder Selbstsperren nutzen. Die Seite zur verantwortungsvollen Nutzung enthält weitere Hinweise. ThinkBetAI soll Entscheidungen verlangsamen und erklären, nicht die Einsatzhäufigkeit steigern.",
      ],
    },
    {
      heading: "So beurteilst du die Qualität eines Analyseberichts",
      body: [
        "Ein hochwertiger Bericht beantwortet konkrete Fragen. Welche Quote wurde geprüft? Welche Break-even-Wahrscheinlichkeit ergibt sich? Wie hoch ist die Modellschätzung, welche faire Quote folgt daraus und welche Unsicherheiten können das Ergebnis verändern? Sind Datenstand und Marktregeln sichtbar? Gibt es Gegenargumente und eine klare Mindestquote? Wenn diese Elemente fehlen, ist die Aussage wahrscheinlich zu oberflächlich.",
        "Achte außerdem auf die Sprache. Garantien, sichere Tipps und angeblich risikofreie Gewinne sind Warnzeichen. Gute Analyse trennt Fakten, Modellannahmen und Interpretation. Sie kann erklären, warum eine Auswahl interessant erscheint, ohne den Eindruck zu erwecken, ein positives Resultat sei geschuldet. Die Möglichkeit eines Passes sollte genauso sichtbar sein wie eine positive Bewertung.",
      ],
      bullets: [
        "Exakter Markt und aktuelle Quote genannt",
        "Break-even-Wahrscheinlichkeit und faire Quote erklärt",
        "Datenstand, Risiken und Gegenargumente sichtbar",
        "Mindestpreis oder Pass-Kriterium angegeben",
        "Keine Garantie- oder Schnell-reich-Versprechen",
      ],
    },
    {
      heading: "Nächste Schritte: erst verstehen, dann entscheiden",
      body: [
        "Beginne mit einem klar definierten Markt und einer aktuellen Quote. Nutze den Analyzer, um die Preislogik, mögliche Modellabweichung und zentrale Risiken zu verstehen. Lies anschließend die Methodik und überprüfe Nachrichten, Aufstellungen sowie Abrechnungsregeln. Wenn wichtige Informationen fehlen oder der Preis sich verändert hat, aktualisiere die Prüfung oder verzichte.",
        "Ein kostenlos erstellter Account kann den Zugang zu den vorhandenen Produktabläufen öffnen. Die Kontoerstellung ist jedoch keine Empfehlung, einen Einsatz zu platzieren oder einen kostenpflichtigen Plan zu wählen. Öffentliche Leitfäden, verantwortungsvolle Nutzung und grundlegende Erklärungen bleiben wichtige Bestandteile der Recherche. Die Entscheidung sollte immer innerhalb persönlicher Grenzen und nur dort erfolgen, wo sie rechtlich zulässig ist.",
      ],
    },
  ] satisfies LocalizedLongFormSection[],
  faqs: [
    {
      question: "Kann eine KI-Wettanalyse sichere Tipps liefern?",
      answer:
        "Nein. Sie kann Quoten, Wahrscheinlichkeiten, Daten und Risiken strukturieren, aber kein Ergebnis garantieren. Auch ein positiver erwarteter Wert kann in einer einzelnen Partie verlieren.",
    },
    {
      question: "Welche Angaben braucht der KI Bet Analyzer?",
      answer:
        "Für eine sinnvolle Prüfung werden mindestens Sportart, Begegnung, konkreter Markt, Auswahl, Linie und aktuelle Quote benötigt. Bei Spieler-Props sind zusätzlich Spieler und Statistik erforderlich.",
    },
    {
      question: "Was bedeutet Break-even-Wahrscheinlichkeit?",
      answer:
        "Sie beschreibt die ungefähre Trefferquote, die bei einer bestimmten Quote nötig wäre, um vor weiteren Kosten langfristig weder Gewinn noch Verlust zu erwarten. Bei Dezimalquoten wird sie vereinfacht als 1 geteilt durch die Quote berechnet.",
    },
    {
      question: "Warum kann sich eine Analyse nach einer Quotenbewegung ändern?",
      answer:
        "Weil die Quote der Preis der Wette ist. Sinkt die Quote, steigt die notwendige Break-even-Wahrscheinlichkeit. Ein zuvor vorhandener mathematischer Vorteil kann dadurch verschwinden.",
    },
    {
      question: "Was ist eine faire Quote?",
      answer:
        "Die faire Quote ist der Kehrwert der geschätzten Eintrittswahrscheinlichkeit. Sie dient als theoretischer Vergleichswert zur angebotenen Marktquote und ist nur so belastbar wie das zugrunde liegende Modell.",
    },
    {
      question: "Wann sollte die Analyse zu keinem Einsatz führen?",
      answer:
        "Wenn kein klarer Preisvorteil besteht, entscheidende Nachrichten fehlen, die Quote zu stark gefallen ist, die Datenqualität gering ist oder persönliche Grenzen gegen eine Teilnahme sprechen.",
    },
    {
      question: "Ist ThinkBetAI ein deutscher Buchmacher?",
      answer:
        "Nein. ThinkBetAI ist eine Analyse- und Informationsplattform. Sie nimmt keine Wetten an, hält keine Wettguthaben und garantiert keine Ergebnisse.",
    },
    {
      question: "Muss ich ein Konto erstellen, um den Leitfaden zu lesen?",
      answer:
        "Nein. Der öffentliche Leitfaden und die grundlegenden Erklärungen sind ohne Konto zugänglich. Ein Account kann zusätzliche Produktfunktionen freischalten.",
    },
  ],
};
