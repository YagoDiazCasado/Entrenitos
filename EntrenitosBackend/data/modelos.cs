using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;

namespace EntrenitosBackEnd
{
    public class Ejercicio
    {
        [Key] public int Id_Ejercicio { get; set; }
        public string nombre { get; set; }
        public string descripcion { get; set; }
        public int series { get; set; }
        public int repeticiones { get; set; }
        public string descanso { get; set; }
        public int posicion { get; set; }
        
        [ForeignKey("Dia")] public int? fk_dia { get; set; }
        
        public Ejercicio() {}
    }

    public class LoginRequest
{
    public string id_Cliente { get; set; }
    public string password { get; set; }
}

    public class Dia
    {
        [Key] public int Id_Dia { get; set; }
        public string nombre_dia { get; set; }
        public float kcal { get; set; }
        public bool activo { get; set; }
        public List<Ejercicio> listaEjercicios { get; set; }

        [ForeignKey("Semana")] public int? fk_semana { get; set; }
        
        public Dia() { listaEjercicios = new List<Ejercicio>(); }
    }

    public class Semana
    {
        [Key] public int Id_Semana { get; set; }
        public string nombreSemana { get; set; }
        public int posicion { get; set; }
        public List<Dia> listaDias { get; set; }

        [ForeignKey("Ciclo")] public int? fk_ciclo { get; set; }
        
        public Semana() { listaDias = new List<Dia>(7); }
    }

    public class Ciclo
    {
        [Key] public int Id_Ciclo { get; set; }
        public string nombre { get; set; }
        public bool siguiendo { get; set; }
        public DateTime? fechaActivacion { get; set; }
        public List<Semana> listaSemanas { get; set; }
        [ForeignKey("Cliente")] public string? fk_cliente { get; set; }        
        public Ciclo() { listaSemanas = new List<Semana>(); }
    }

    public class Cliente
    {
        [Key] public string id_Cliente { get; set; }
        public string password { get; set; }

        // Mapeo para Base de datos
        public List<Ciclo> CiclosDB { get; set; }

        // Requisito: Diccionario expuesto
        [NotMapped]
        public Dictionary<string, Ciclo> mapaCiclos 
        { 
            get => CiclosDB?.ToDictionary(c => c.nombre, c => c) ?? new Dictionary<string, Ciclo>();
            set => CiclosDB = value?.Values.ToList() ?? new List<Ciclo>();
        }

        public Cliente() { CiclosDB = new List<Ciclo>(); }
    }
}