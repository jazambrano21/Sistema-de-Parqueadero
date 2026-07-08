package ec.edu.espe.usuarios;

import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@ComponentScan(
	basePackages = "ec.edu.espe.usuarios",
	excludeFilters = @ComponentScan.Filter(
		type = FilterType.REGEX,
		pattern = "ec\\.edu\\.espe\\.usuarios\\.config\\..*"
	)
)
public class UsuariosApplication {

	public static void main(String[] args) {
		SpringApplication.run(UsuariosApplication.class, args);
	}

}
