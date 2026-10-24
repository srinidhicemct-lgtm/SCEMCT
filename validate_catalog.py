#!/usr/bin/env python3
"""Optional local validator for the static embroidery catalogue."""

import json
import sys
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parent
MANIFEST = ROOT / "designs.json"


def validate() -> list[str]:
    try:
        catalog = json.loads(MANIFEST.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        return [f"Could not read valid JSON from designs.json: {error}"]

    if not isinstance(catalog, dict) or not isinstance(catalog.get("designs"), list):
        return ['designs.json must contain a top-level "designs" array.']

    errors: list[str] = []
    seen: set[str] = set()

    for index, entry in enumerate(catalog["designs"], start=1):
        label = f"Entry {index}"
        if not isinstance(entry, dict):
            errors.append(f"{label} must be an object.")
            continue

        number = entry.get("number")
        image = entry.get("image")
        alt = entry.get("alt")

        if not isinstance(number, str) or not number.strip():
            errors.append(f"{label} needs a non-blank string number.")
        else:
            normalized = number.strip().casefold()
            if normalized in seen:
                errors.append(f'{label} duplicates design number "{number}" after normalization.')
            seen.add(normalized)

        if not isinstance(image, str) or not image.strip():
            errors.append(f"{label} needs an image path.")
        else:
            image_path = PurePosixPath(image)
            if (
                image_path.is_absolute()
                or "\\" in image
                or ".." in image_path.parts
                or (image_path.parts and ":" in image_path.parts[0])
            ):
                errors.append(f'{label} has an unsafe relative image path: "{image}".')
            elif not (ROOT / Path(*image_path.parts)).is_file():
                errors.append(f'{label} references a missing image file: "{image}".')

        if not isinstance(alt, str) or not alt.strip():
            errors.append(f"{label} needs descriptive alt text.")
        elif isinstance(number, str) and number not in alt:
            errors.append(f"{label} alt text should include the exact design number.")

        if "demo" in entry and not isinstance(entry["demo"], bool):
            errors.append(f'{label} must use true or false for the optional "demo" flag.')

    return errors


if __name__ == "__main__":
    issues = validate()
    if issues:
        print("Catalogue validation failed:")
        for issue in issues:
            print(f"- {issue}")
        sys.exit(1)
    print("Catalogue validation passed.")
