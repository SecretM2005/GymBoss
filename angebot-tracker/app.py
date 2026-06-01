import streamlit as st
import pandas as pd
from datetime import datetime

from database import (
    init_db,
    add_offer,
    get_all_offers,
    update_status,
    update_last_followup,
    delete_offer,
    get_metrics,
)
from ai import generate_followup
from scheduler import start_scheduler

# ── Initialisierung ────────────────────────────────────────────────────────────

st.set_page_config(page_title="Angebot Tracker", page_icon="📋", layout="wide")
init_db()

# Scheduler einmalig starten (nur beim ersten Render)
if "scheduler_started" not in st.session_state:
    start_scheduler()
    st.session_state["scheduler_started"] = True

# Session-State für generierte Mail
if "generated_mail" not in st.session_state:
    st.session_state["generated_mail"] = ""
if "mail_offer_id" not in st.session_state:
    st.session_state["mail_offer_id"] = None

# ── Hilfsfunktionen ────────────────────────────────────────────────────────────

STATUS_COLORS = {
    "offen": "🟡",
    "gewonnen": "🟢",
    "verloren": "🔴",
    "überfällig": "🟠",
}


def days_open(created_at: str) -> int:
    return (datetime.now() - datetime.fromisoformat(created_at)).days


# ── Sidebar – Neues Angebot eintragen ─────────────────────────────────────────

st.sidebar.title("📋 Angebot Tracker")
st.sidebar.markdown("---")
st.sidebar.subheader("➕ Neues Angebot eintragen")

with st.sidebar.form("new_offer_form", clear_on_submit=True):
    client_name = st.text_input("Kundenname *", placeholder="Max Mustermann GmbH")
    client_email = st.text_input("Kunden-E-Mail", placeholder="max@example.com")
    project_desc = st.text_area(
        "Projektbeschreibung", placeholder="Webseite, SEO-Paket, …", height=100
    )
    amount = st.number_input("Angebotsbetrag (€)", min_value=0.0, step=100.0, format="%.2f")
    followup_days = st.number_input(
        "Erinnerung nach X Tagen", min_value=1, max_value=90, value=3
    )
    notes = st.text_area("Notizen", height=80)
    submitted = st.form_submit_button("Angebot speichern", use_container_width=True)

    if submitted:
        if not client_name.strip():
            st.error("Kundenname ist ein Pflichtfeld.")
        else:
            add_offer(
                client_name.strip(),
                client_email.strip(),
                project_desc.strip(),
                amount,
                int(followup_days),
                notes.strip(),
            )
            st.success(f"Angebot für „{client_name}" gespeichert!")
            st.rerun()

# ── Hauptbereich ───────────────────────────────────────────────────────────────

st.title("📋 Angebot Tracker")

# Metriken
metrics = get_metrics()
col1, col2, col3 = st.columns(3)
col1.metric(
    "Gesamtvolumen (offen)",
    f"{metrics['total_open_volume']:,.2f} €".replace(",", "."),
)
col2.metric("Überfällige Angebote", metrics["overdue_count"])
col3.metric("Abschlussquote", f"{metrics['close_rate']:.1f} %")

st.markdown("---")

# Angebotsübersicht
st.subheader("Alle Angebote")

offers = get_all_offers()
if not offers:
    st.info("Noch keine Angebote vorhanden. Trage dein erstes Angebot in der Seitenleiste ein.")
else:
    for row in offers:
        d_open = days_open(row["created_at"])
        status_icon = STATUS_COLORS.get(row["status"], "⚪")
        created_fmt = datetime.fromisoformat(row["created_at"]).strftime("%d.%m.%Y")

        with st.container():
            cols = st.columns([3, 2, 2, 2, 2, 5])
            cols[0].markdown(f"**{row['client_name']}**")
            cols[1].markdown(f"{row['amount']:,.2f} €".replace(",", "."))
            cols[2].markdown(f"📅 {created_fmt}")
            cols[3].markdown(f"⏱ {d_open} Tag(e)")
            cols[4].markdown(f"{status_icon} {row['status']}")

            with cols[5]:
                action_cols = st.columns(3)

                # Status ändern
                new_status = action_cols[0].selectbox(
                    "Status",
                    ["offen", "gewonnen", "verloren"],
                    index=["offen", "gewonnen", "verloren"].index(
                        row["status"] if row["status"] in ["offen", "gewonnen", "verloren"] else "offen"
                    ),
                    key=f"status_{row['id']}",
                    label_visibility="collapsed",
                )
                if new_status != row["status"]:
                    update_status(row["id"], new_status)
                    st.rerun()

                # Follow-up generieren
                if action_cols[1].button("✉ Follow-up", key=f"followup_{row['id']}"):
                    if not row["project_desc"]:
                        st.warning("Bitte zuerst eine Projektbeschreibung eintragen.")
                    else:
                        with st.spinner("KI generiert Follow-up Mail …"):
                            try:
                                mail = generate_followup(
                                    row["client_name"],
                                    row["project_desc"],
                                    row["amount"],
                                    d_open,
                                )
                                st.session_state["generated_mail"] = mail
                                st.session_state["mail_offer_id"] = row["id"]
                                update_last_followup(row["id"])
                            except Exception as e:
                                st.error(f"Fehler bei der KI-Generierung: {e}")

                # Löschen
                if action_cols[2].button("🗑 Löschen", key=f"delete_{row['id']}"):
                    delete_offer(row["id"])
                    st.rerun()

        st.divider()

# ── Generierte Mail anzeigen ──────────────────────────────────────────────────

if st.session_state["generated_mail"]:
    st.markdown("---")
    st.subheader("✉ Generierte Follow-up Mail")

    offer_id = st.session_state["mail_offer_id"]
    offer_row = next((r for r in offers if r["id"] == offer_id), None)
    if offer_row:
        st.caption(
            f"Empfänger: **{offer_row['client_name']}**"
            + (f" ({offer_row['client_email']})" if offer_row["client_email"] else "")
        )

    edited_mail = st.text_area(
        "Mail bearbeiten",
        value=st.session_state["generated_mail"],
        height=200,
        key="mail_edit_area",
    )

    copy_col, clear_col = st.columns([1, 5])
    if copy_col.button("📋 Mail kopieren"):
        st.code(edited_mail, language=None)
        st.info("Markiere den Text oben und kopiere ihn mit Strg+C / ⌘+C.")

    if clear_col.button("✖ Schließen"):
        st.session_state["generated_mail"] = ""
        st.session_state["mail_offer_id"] = None
        st.rerun()
