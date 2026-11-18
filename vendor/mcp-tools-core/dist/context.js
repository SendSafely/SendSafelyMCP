export class CredentialResolutionError extends Error {
    constructor(message, name) {
        super(message);
        this.name = name;
    }
}
export class MissingCredentialsError extends CredentialResolutionError {
    constructor(message) {
        super(message, "MissingCredentialsError");
    }
}
export class InvalidTokenError extends CredentialResolutionError {
    constructor(message) {
        super(message, "InvalidTokenError");
    }
}
