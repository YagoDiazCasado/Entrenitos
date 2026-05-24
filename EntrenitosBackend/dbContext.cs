using Microsoft.EntityFrameworkCore;

namespace EntrenitosBackEnd
{
    public class EntrenitosContext : DbContext
    {
        public DbSet<Cliente> Clientes { get; set; }
        public DbSet<Ciclo> Ciclos { get; set; }
        public DbSet<Semana> Semanas { get; set; }
        public DbSet<Dia> Dias { get; set; }
        public DbSet<Ejercicio> Ejercicios { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            // Se utiliza la contraseña requerida en la instrucción de BD.
            string connectionString = "Server=127.0.0.1;Database=Entrenitos;User=root;Password=M0j$to18*C;";
            optionsBuilder.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString));
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Cliente>()
                .HasMany(c => c.CiclosDB)
                .WithOne()
                .HasForeignKey(c => c.fk_cliente)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Ciclo>()
                .HasMany(c => c.listaSemanas)
                .WithOne()
                .HasForeignKey(s => s.fk_ciclo)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Semana>()
                .HasMany(s => s.listaDias)
                .WithOne()
                .HasForeignKey(d => d.fk_semana)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Dia>()
                .HasMany(d => d.listaEjercicios)
                .WithOne()
                .HasForeignKey(e => e.fk_dia)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}