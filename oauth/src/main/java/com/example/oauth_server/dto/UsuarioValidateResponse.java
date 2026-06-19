package com.example.oauth_server.dto;

import lombok.Data;
import java.util.List;

@Data
public class UsuarioValidateResponse {
    private boolean valid;
    private String username;
    private List<String> roles;
    private String message;
}
