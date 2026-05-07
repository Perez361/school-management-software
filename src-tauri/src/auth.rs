use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use std::sync::OnceLock;

static JWT_SECRET: OnceLock<String> = OnceLock::new();

fn jwt_secret() -> &'static [u8] {
    JWT_SECRET
        .get_or_init(|| {
            std::env::var("SMS_JWT_SECRET")
                .unwrap_or_else(|_| "sms_jwt_secret_key_change_in_prod".to_string())
        })
        .as_bytes()
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: i64,   // user id
    pub email: String,
    pub role: String,
    pub exp: usize,
}

pub fn create_token(user_id: i64, email: &str, role: &str) -> Result<String, String> {
    let exp = chrono::Utc::now()
        .checked_add_signed(chrono::Duration::days(30))
        .expect("valid timestamp")
        .timestamp() as usize;

    let claims = Claims { sub: user_id, email: email.to_string(), role: role.to_string(), exp };
    encode(&Header::default(), &claims, &EncodingKey::from_secret(jwt_secret()))
        .map_err(|e| e.to_string())
}

pub fn validate_token(token: &str) -> Result<Claims, String> {
    decode::<Claims>(token, &DecodingKey::from_secret(jwt_secret()), &Validation::default())
        .map(|d| d.claims)
        .map_err(|e| e.to_string())
}
