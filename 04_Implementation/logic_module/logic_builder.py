"""
ILDLM Framework - Legal Logic Builder
Module: logic_module/logic_builder.py
"""

from typing import List, Dict, Any

class LogicBuilder:
    """
    Translates parsed legal clauses into formal IF-THEN computational logic rules
    and state-transition rules suitable for deterministic execution in Smart Contracts.
    """

    def __init__(self):
        pass

    def build_logic_rules(self, parsed_clauses: List[Dict[str, Any]], extracted_entities: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Converts parsed clauses into executable logic specifications:
        Example:
        IF (trigger == "within 30 days") AND (payment_received == False)
        THEN execute_penalty("late fee")
        """
        rules = []
        rule_counter = 1

        parties = extracted_entities.get("parties", [])
        party_a = parties[0]["name"] if len(parties) > 0 else "PartyA"
        party_b = parties[1]["name"] if len(parties) > 1 else "PartyB"

        for clause in parsed_clauses:
            modality = clause.get("modality", "DECLARATIVE")
            heading = clause.get("heading", "")
            raw_text = clause.get("raw_text", "")
            trigger = clause.get("trigger_condition", "")
            penalty = clause.get("penalty_clause", "")

            rule_id = f"RULE-{rule_counter:03d}"
            rule_counter += 1

            if "payment" in heading.lower() or "consideration" in heading.lower() or modality == "OBLIGATION":
                rule = {
                    "rule_id": rule_id,
                    "clause_id": clause["clause_id"],
                    "rule_type": "PAYMENT_OBLIGATION",
                    "condition": f"IF state == ContractState.Active AND msg.sender == {party_a}",
                    "action": f"THEN transfer_funds({party_b}) AND set_state(ContractState.Fulfilled)",
                    "else_action": f"ELSE IF current_time > deadline THEN apply_penalty('{penalty}') AND set_state(ContractState.Defaulted)",
                    "raw_clause": raw_text[:120] + "..."
                }
            elif modality == "PROHIBITION":
                rule = {
                    "rule_id": rule_id,
                    "clause_id": clause["clause_id"],
                    "rule_type": "RESTRICTION",
                    "condition": f"IF breach_detected == True",
                    "action": f"THEN trigger_clause_breach('{clause['clause_id']}') AND forfeit_escrow()",
                    "else_action": "ELSE continue_execution()",
                    "raw_clause": raw_text[:120] + "..."
                }
            elif "termination" in heading.lower() or "notice" in trigger.lower():
                rule = {
                    "rule_id": rule_id,
                    "clause_id": clause["clause_id"],
                    "rule_type": "TERMINATION",
                    "condition": f"IF termination_requested == True AND notice_period_elapsed == True",
                    "action": "THEN set_state(ContractState.Terminated) AND refund_remaining_balance()",
                    "else_action": "ELSE revert('Notice period not fulfilled')",
                    "raw_clause": raw_text[:120] + "..."
                }
            else:
                rule = {
                    "rule_id": rule_id,
                    "clause_id": clause["clause_id"],
                    "rule_type": "GENERAL_CLAUSE",
                    "condition": f"IF condition_met('{trigger}')",
                    "action": "THEN record_event_on_ledger()",
                    "else_action": "ELSE retain_state()",
                    "raw_clause": raw_text[:120] + "..."
                }

            rules.append(rule)

        return rules
