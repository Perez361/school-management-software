use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};

const JWT_SECRET: &[u8] = b"sms_jwt_secret_key_change_in_prod";

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
    encode(&Header::default(), &claims, &EncodingKey::from_secret(JWT_SECRET))
        .map_err(|e| e.to_string())
}

pub fn validate_token(token: &str) -> Result<Claims, String> {
    decode::<Claims>(token, &DecodingKey::from_secret(JWT_SECRET), &Validation::default())
        .map(|d| d.claims)
        .map_err(|e| e.to_string())
}
