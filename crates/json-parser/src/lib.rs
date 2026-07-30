use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn init_panic_hook() {
    console_error_panic_hook::set_once();
}

#[wasm_bindgen]
pub fn count_top_level_keys(json: &str) -> Result<u32, JsError> {
    let value: serde_json::Value =
        serde_json::from_str(json).map_err(|error| JsError::new(&error.to_string()))?;

    let count = match value {
        serde_json::Value::Object(map) => map.len(),
        serde_json::Value::Array(items) => items.len(),
        _ => {
            return Err(JsError::new(
                "JSON のトップレベルがオブジェクトまたは配列ではありません",
            ));
        }
    };

    u32::try_from(count).map_err(|_| JsError::new("要素数が多すぎます"))
}
