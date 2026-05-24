using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);
var secretKey = "ClaveSuperSecretaEntrenitos2026_Minimo32Caracteres!";

// 1. REGISTRAR SERVICIOS
builder.Services.AddControllers().AddJsonOptions(options => {
        options.JsonSerializerOptions.PropertyNamingPolicy = null;
        options.JsonSerializerOptions.NumberHandling = System.Text.Json.Serialization.JsonNumberHandling.AllowReadingFromString;
    });
builder.Services.AddOpenApi();

var keyBytes = Encoding.ASCII.GetBytes(secretKey);

builder.Services.AddAuthentication(config => {
    config.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    config.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(config => {
    config.RequireHttpsMetadata = false;
    config.SaveToken = true;
    config.TokenValidationParameters = new TokenValidationParameters {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
        ValidateIssuer = false,
        ValidateAudience = false
    };
});

// 2. CONFIGURAR CORS (Antes del Build)
builder.Services.AddCors(options =>
{
    options.AddPolicy("Libre", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// 3. CONFIGURAR EL PIPELINE (El orden importa)
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Activar CORS antes de mapear rutas
app.UseCors("Libre");

app.UseHttpsRedirection();

app.UseAuthentication(); 
app.UseAuthorization();

// 4. MAPEAR CONTROLADORES
app.MapControllers(); // Busca automáticamente tus clases [ApiController]

app.Run();