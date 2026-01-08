import json
import jsonschema
from pathlib import Path
from component_catalog_builder import ComponentCatalogBuilder
from a2ui.a2ui_extension import STANDARD_CATALOG_ID

def verify():
    print("Verifying A2UI Part Converter Logic...")
    
    spec_root = Path(__file__).parent / "../../../../specification/0.8/json"
    schema_path = str(spec_root.joinpath("server_to_client.json"))
    catalog_path = str(spec_root.joinpath("standard_catalog_definition.json"))
    
    print(f"Schema Path: {schema_path}")
    print(f"Catalog Path: {catalog_path}")

    builder = ComponentCatalogBuilder(
        a2ui_schema_path=schema_path,
        uri_to_local_catalog_path={
            STANDARD_CATALOG_ID: catalog_path,
        },
        default_catalog_uri=STANDARD_CATALOG_ID
    )

    # Load schema ( simulating default client without rizzcharts capabilities)
    a2ui_schema, uri = builder.load_a2ui_schema(client_ui_capabilities=None)
    print(f"Loaded Schema for Catalog: {uri}")

    # Prepare array schema as tool does
    a2ui_schema_object = {"type": "array", "items": a2ui_schema}

    # Test Chart JSON
    try:
        print("\n--- Testing chart.json ---")
        chart_str = Path("examples/standard_catalog/chart.json").read_text()
        chart_json = json.loads(chart_str)
        jsonschema.validate(instance=chart_json, schema=a2ui_schema_object)
        print("SUCCESS: chart.json passed validation.")
    except Exception as e:
        print(f"FAILURE: chart.json failed validation: {e}")

    # Test Map JSON
    try:
        print("\n--- Testing map.json ---")
        map_str = Path("examples/standard_catalog/map.json").read_text()
        map_json = json.loads(map_str)
        jsonschema.validate(instance=map_json, schema=a2ui_schema_object)
        print("SUCCESS: map.json passed validation.")
    except Exception as e:
        print(f"FAILURE: map.json failed validation: {e}")

if __name__ == "__main__":
    verify()
