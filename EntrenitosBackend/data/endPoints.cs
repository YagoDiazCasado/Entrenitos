using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System;
using System.Linq;

namespace EntrenitosBackEnd
{
    [ApiController]
    [Route("api/[controller]")]
    public class EntrenitosController : ControllerBase
    {
        private readonly EntrenitosContext _context;

        public EntrenitosController()
        {
            _context = new EntrenitosContext();
        }

        [HttpPost("PostCliente")]
public IActionResult PostCliente([FromBody] LoginRequest req) // Recibe el objeto
{
    try
    {
        // 1. Ahora validamos usando req.id_Cliente y req.password
        if (string.IsNullOrEmpty(req.id_Cliente) || string.IsNullOrEmpty(req.password))
            return BadRequest("Credenciales inválidas.");

        // 2. Buscamos en la BD usando req.id_Cliente
        if (_context.Clientes.Any(c => c.id_Cliente == req.id_Cliente))
            return Conflict("El cliente ya existe.");

        var nuevoCliente = new Cliente
        {
            id_Cliente = req.id_Cliente, // Asignamos desde el objeto
            password = BCrypt.Net.BCrypt.HashPassword(req.password) // Hasheamos desde el objeto
        };

        _context.Clientes.Add(nuevoCliente);
        _context.SaveChanges();

        return Ok(new { Mensaje = "Cliente registrado con éxito." });
    }
    catch (Exception ex)
    {
        return StatusCode(500, $"Error interno: {ex.Message}");
    }
}

      [HttpPost("Login")]
public IActionResult Login([FromBody] LoginRequest req) // Cambiado a [FromBody]
{
    try
    {
        // Ahora accedemos a req.id_Cliente y req.password
        var cliente = _context.Clientes.FirstOrDefault(c => c.id_Cliente == req.id_Cliente);
        //var cliente = _context.Clientes.Include(c => c.CiclosDB).ThenInclude(ciclo => ciclo.listaSemanas).ThenInclude(semana => semana.listaDias).ThenInclude(dia => dia.listaEjercicios).FirstOrDefault(c => c.id_Cliente == id);
        
        if (cliente == null || !BCrypt.Net.BCrypt.Verify(req.password, cliente.password))
            return Unauthorized("Usuario o contraseña incorrectos.");

        var token = JwtManager.GenerateToken(cliente.id_Cliente);
        return Ok(new { Token = token, Id_Cliente = cliente.id_Cliente });
    }
    catch (Exception ex)
    {
        return StatusCode(500, $"Error interno: {ex.Message}");
    }
}
        [Authorize]
        [HttpGet("GetCliente/{id_Cliente}")]
        public IActionResult GetCliente(string id_Cliente)
        {
            try
            {
                // Validación estricta: Solo el dueño puede consultar sus datos
                var claimId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (claimId != id_Cliente)
                    return Forbid("No tienes permisos para ver estos datos.");

                var cliente = _context.Clientes
                    .Include(c => c.CiclosDB)
                        .ThenInclude(ci => ci.listaSemanas)
                            .ThenInclude(s => s.listaDias)
                                .ThenInclude(d => d.listaEjercicios)
                    .FirstOrDefault(c => c.id_Cliente == id_Cliente);

                if (cliente == null)
                    return NotFound("Cliente no encontrado.");

                cliente.password = null; // Omitir hash en la respuesta
                return Ok(cliente);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno: {ex.Message}");
            }
        }

        [Authorize]
        [HttpPost("PostCiclo/{id_Cliente}")]
        public IActionResult PostCiclo(string id_Cliente, [FromBody] Ciclo cicloActualizado)
        {
            try
            {
                var claimId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (claimId != id_Cliente)
                    return Forbid("No tienes permisos para alterar estos datos.");

                // Regla de Negocio Crítica
                if (cicloActualizado.siguiendo)
                {
                        var otrosCiclos = _context.Ciclos
                        .Where(c => c.fk_cliente == id_Cliente && c.Id_Ciclo != cicloActualizado.Id_Ciclo)
                        .ToList();                    foreach (var c in otrosCiclos)
                    {
                        if (c.Id_Ciclo != cicloActualizado.Id_Ciclo)
                        {
                            c.siguiendo = false;
                        }
                    }
                }

                cicloActualizado.fk_cliente = id_Cliente;

                if (cicloActualizado.Id_Ciclo == 0) // Es nuevo
                {
                    _context.Ciclos.Add(cicloActualizado);
                }
                else // Actualización
                {
                    _context.Ciclos.Update(cicloActualizado);
                }

                _context.SaveChanges();
                return Ok(new { Mensaje = "Ciclo procesado con éxito." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno: {ex.Message}");
            }
        }

        [Authorize]
        [HttpDelete("DeleteSemana/{id_Semana}")]
        public IActionResult DeleteSemana(int id_Semana)
        {
            try
            {
                var semana = _context.Semanas.FirstOrDefault(s => s.Id_Semana == id_Semana);
                if (semana == null) return NotFound("Semana no encontrada.");

                // OPCIONAL: Validar que el usuario sea el dueño comprobando el ciclo y el cliente,
                // asumiendo que confías en el Authorize o lo validas si navegas al Ciclo.
                // var ciclo = _context.Ciclos.FirstOrDefault(c => c.Id_Ciclo == semana.fk_ciclo);
                // var claimId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                // if (ciclo == null || ciclo.fk_cliente != claimId) return Forbid();

                _context.Semanas.Remove(semana);
                _context.SaveChanges();
                return Ok(new { Mensaje = "Semana eliminada con éxito." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno: {ex.Message}");
            }
        }
    }
}