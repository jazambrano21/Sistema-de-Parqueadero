package ec.edu.espe.usuarios.oauth.dto;

import java.util.List;

public class TokenRequest {
    private String username;
    private List<String> roles;
    /** UUID del tenant al que pertenece el usuario. Se incluye como claim en el JWT. */
    private String tenantId;

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public List<String> getRoles() { return roles; }
    public void setRoles(List<String> roles) { this.roles = roles; }
    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }
}
