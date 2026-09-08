use axum::extract::{Path, State};
use axum::Json;

use crate::session_store::{AppSessionStoreError, AppSessionView};
use crate::state::AppState;

use super::app_sessions::AppSessionApiError;

// Console manages local app access without changing the daemon's active identity.
// The existing app-session routes retain their selected-identity contract.
pub async fn list_requests(State(state): State<AppState>) -> Json<Vec<AppSessionView>> {
    let mut requests = Vec::new();
    for identity in state.local_identities.list().await.identities {
        requests.extend(
            state
                .sessions
                .list_requests_for_identity(&identity.address)
                .await,
        );
    }
    Json(requests)
}

pub async fn list_sessions(State(state): State<AppState>) -> Json<Vec<AppSessionView>> {
    Json(local_sessions(&state).await)
}

pub async fn revoke_session(
    State(state): State<AppState>,
    Path(session_id): Path<String>,
) -> Result<Json<AppSessionView>, AppSessionApiError> {
    let session = local_sessions(&state)
        .await
        .into_iter()
        .find(|session| session.session_id.as_deref() == Some(&session_id))
        .ok_or_else(|| AppSessionStoreError::SessionNotFound(session_id.clone()))?;
    let identity = session
        .identity
        .ok_or(AppSessionStoreError::MissingIdentity)?;
    let revoked = state
        .sessions
        .revoke_session_for_identity(&session_id, &identity)
        .await?;
    state.data_change_streams.revoke_session(&session_id).await;
    Ok(Json(revoked))
}

async fn local_sessions(state: &AppState) -> Vec<AppSessionView> {
    let mut sessions = Vec::new();
    for identity in state.local_identities.list().await.identities {
        sessions.extend(
            state
                .sessions
                .list_sessions_for_identity(&identity.address)
                .await,
        );
    }
    sessions
}
