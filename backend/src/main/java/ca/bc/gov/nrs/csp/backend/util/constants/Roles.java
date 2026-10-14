package ca.bc.gov.nrs.csp.backend.util.constants;

/**
 * FAM role constants for CSP.
 * FAM client codes map exactly to these existing internal permissions
 * (e.g. code "CSP_ADMIN" → role "ADMIN").
 */
public final class Roles {

    private Roles() {}

    public static final String ADMIN   = "ADMIN";
    public static final String APPROVE = "APPROVE";
    public static final String VIEW    = "VIEW";
}
