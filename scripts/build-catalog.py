"""Build the searchable Pokédex from the same upstream data as PokéAPI v2."""
import argparse
import csv
import io
import json
from collections import defaultdict
from pathlib import Path
from urllib.request import urlopen

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--csv-dir", type=Path, help="Use a local PokéAPI data/v2/csv directory")
parser.add_argument("--ref", default="master", help="Upstream branch or commit")
options = parser.parse_args()


def read_table(name):
    if options.csv_dir:
        with (options.csv_dir / f"{name}.csv").open(encoding="utf-8", newline="") as file:
            return list(csv.DictReader(file))
    url = f"https://raw.githubusercontent.com/PokeAPI/pokeapi/{options.ref}/data/v2/csv/{name}.csv"
    with urlopen(url, timeout=45) as raw:
        return list(csv.DictReader(io.TextIOWrapper(raw, encoding="utf-8", newline="")))


def localized(table, key, value="name", languages=("1", "11")):
    rows = read_table(table)
    names = {}
    for language in reversed(languages):
        for row in rows:
            if row["local_language_id"] == language and row[value]:
                names[int(row[key])] = row[value]
    return names


def by_slot(table, slot):
    grouped = defaultdict(list)
    for row in sorted(read_table(table), key=lambda r: int(r[slot])):
        grouped[int(row["pokemon_id"])].append(row)
    return grouped


ja_names = localized("pokemon_species_names", "pokemon_species_id")
en_names = localized("pokemon_species_names", "pokemon_species_id", languages=("9",))
descriptions = {}
for row in read_table("pokemon_species_flavor_text"):
    if row["language_id"] == "11":
        descriptions.setdefault(int(row["species_id"]), row["flavor_text"].replace("\f", " "))

species = {}
for row in read_table("pokemon_species"):
    number = int(row["id"])
    species[number] = {
        "ja": ja_names.get(number, row["identifier"]),
        "en": en_names.get(number, row["identifier"]),
        "generation": int(row["generation_id"]),
        "description": descriptions.get(number, ""),
    }

type_keys = {r["id"]: r["identifier"] for r in read_table("types")}
ability_keys = {r["id"]: r["identifier"] for r in read_table("abilities")}
ability_names = localized("ability_names", "ability_id")
stat_names = localized("stat_names", "stat_id")
forms = {r["pokemon_id"]: int(r["id"]) for r in read_table("pokemon_forms") if r["is_default"] == "1"}
form_names = localized("pokemon_form_names", "pokemon_form_id", "form_name")
named_forms = localized("pokemon_form_names", "pokemon_form_id", "pokemon_name")
english_forms = localized("pokemon_form_names", "pokemon_form_id", "pokemon_name", ("9",))
types = by_slot("pokemon_types", "slot")
abilities = by_slot("pokemon_abilities", "slot")
stats = by_slot("pokemon_stats", "stat_id")

entries = []
for row in read_table("pokemon"):
    pid = int(row["id"])
    number = int(row["species_id"])
    form_id = forms.get(row["id"])
    form_name = form_names.get(form_id) or named_forms.get(form_id, "")
    english_form = english_forms.get(form_id, "") if row["is_default"] == "0" else ""
    entries.append({
        "id": pid,
        "number": number,
        "name": row["identifier"],
        "form": form_name,
        "englishForm": english_form,
        "variant": row["is_default"] == "0",
        "types": [type_keys[r["type_id"]] for r in types[pid]],
        "abilities": [ability_keys[r["ability_id"]] for r in abilities[pid]],
        "stats": [int(r["base_stat"]) for r in stats[pid]],
    })

catalog = {
    "species": species,
    "abilities": {slug: ability_names.get(int(key), slug) for key, slug in ability_keys.items()},
    "statNames": [stat_names[i] for i in range(1, 7)],
    "entries": entries,
}
destination = Path(__file__).resolve().parents[1] / "public/data/catalog.json"
destination.parent.mkdir(parents=True, exist_ok=True)
temporary = destination.with_suffix(".tmp")
temporary.write_text(json.dumps(catalog, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
temporary.replace(destination)
print(f"{len(species)} species, {len(entries)} entries")
