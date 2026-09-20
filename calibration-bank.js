(()=>{"use strict";
const VERSION="2026-09-20-v1";
const ranges={strong:[80,100],adequate:[60,82],weak:[25,59],critical:[0,49]};
const C={
 negotiation:[
  ["N1","Contratista","Permiso de trabajo incompleto","Un contratista presiona para iniciar una tarea crítica con el permiso incompleto.","Si no arrancamos ahora, ustedes tendrán el retraso.","Coordinar responsabilidades y habilitar solo con controles verificables.","No autorizar sin condiciones seguras y permisos requeridos.",[
   ["strong","No podemos iniciar con el permiso incompleto. Revisemos ahora qué control falta, quién lo valida y qué podemos preparar en paralelo para arrancar apenas quede verificado."],
   ["adequate","Primero completemos el permiso y después comenzamos. Puedo ayudar a revisar qué falta para no perder más tiempo."],
   ["weak","Voy a consultar si podemos hacer una excepción porque entiendo que el atraso es importante."],
   ["critical","Firmemos con una observación y comiencen; luego completamos el permiso para no perder producción."]
  ]],
  ["N2","Junta directiva","Inversión preventiva aplazada","La dirección propone postergar seis meses una medida de ingeniería ante un riesgo relevante.","¿Puede esperar seis meses?","Lograr una decisión informada y proporcional al riesgo.","No aceptar continuidad si el riesgo exige intervención inmediata.",[
   ["strong","Antes de decidir comparemos exposición, severidad, obligación, eficacia y costo de demora. Si no puede esperarse, propongo control temporal verificable y un plan por fases con fecha y responsable."],
   ["adequate","Presentaría el riesgo y propondría una alternativa temporal mientras se consigue presupuesto para la solución definitiva."],
   ["weak","Insistiría en que la seguridad siempre debe estar primero y pediría aprobar el presupuesto."],
   ["critical","Podemos esperar seis meses y omitir esa limitación del informe para no alarmar a la dirección."]
  ]],
  ["N3","Sindicato","Rotación por exposición","La empresa propone rotación y el sindicato teme pérdida salarial y sustitución de controles de ingeniería.","No aceptaremos repartir el riesgo.","Acordar una medida temporal sin abandonar controles superiores.","La rotación no debe sustituir permanentemente controles más eficaces.",[
   ["strong","Entiendo dos preocupaciones: ingreso y que la rotación se vuelva permanente. Revisemos mediciones, duración temporal, protección salarial y el hito concreto para implementar el control de ingeniería."],
   ["adequate","Podemos acordar la rotación solo temporalmente y revisar después el control de ingeniería."],
   ["weak","La rotación es una práctica válida y deberían aceptarla para evitar problemas."],
   ["critical","Si no aceptan la rotación, identificaremos a quienes se opongan para aplicar medidas disciplinarias."]
  ]]
 ],
 communication:[
  ["C1","Trabajador","Barrera retirada","Un trabajador retiró una barrera para avanzar más rápido.","Siempre lo hacemos así y nunca ha pasado nada.","Corregir la conducta asegurando comprensión y acción.","No permitir acceso al peligro sin control.",[
   ["strong","Observé la barrera retirada y queda acceso al peligro. Detengamos la tarea, dime qué dificultad te llevó a retirarla y acordemos cómo continuar con la protección restablecida."],
   ["adequate","Necesito que coloques la barrera antes de continuar; después revisamos por qué la retiraste."],
   ["weak","Ten más cuidado y procura no volver a quitarla."],
   ["critical","Si prometes estar atento puedes terminar esta parte sin la barrera."]
  ]],
  ["C2","Sindicato","Resultados preliminares","Debes comunicar resultados preliminares de exposición todavía en verificación.","¿La empresa está ocultando sobreexposición?","Comunicar hechos, incertidumbre y acciones con claridad.","No presentar como seguro o confirmado lo que aún no lo está.",[
   ["strong","Lo confirmado hasta ahora es esto; estos datos siguen en validación. Mientras cerramos el análisis activamos estas medidas y compartiremos la actualización el viernes con la misma base de datos."],
   ["adequate","Hay resultados preliminares y todavía faltan verificaciones; cuando terminemos entregaremos el informe y mientras aplicaremos medidas preventivas."],
   ["weak","Esperemos el informe final para no generar confusión y entonces explicamos todo."],
   ["critical","Digan que no hay sobreexposición; después ajustamos el mensaje si los resultados definitivos cambian."]
  ]],
  ["C3","Comunidad","Humo bajo incertidumbre","Vecinos preguntan por humo mientras el alcance aún se evalúa.","¿Estamos en peligro?","Comunicar incertidumbre de forma comprensible y útil.","No afirmar ausencia de riesgo sin evidencia.",[
   ["strong","Entiendo la preocupación. Podemos confirmar qué ocurrió, qué todavía no sabemos, qué precauciones deben seguir ahora y a qué hora daremos la próxima actualización."],
   ["adequate","Aún estamos evaluando el alcance; les informaremos lo confirmado y las medidas preventivas mientras obtenemos más datos."],
   ["weak","Estamos revisando la situación; por ahora lean el comunicado técnico publicado en la web."],
   ["critical","No existe ningún peligro, así que mantengan la calma aunque todavía no tengamos todos los resultados."]
  ]]
 ],
 leadership:[
  ["L1","Equipo de trabajo","Reporte ignorado","El equipo dice que reportó varias veces una fuga menor sin obtener respuesta.","¿Para qué reportar si nunca pasa nada?","Recuperar confianza con acción, recursos y seguimiento.","No silenciar ni castigar el reporte.",[
   ["strong","Tienen razón en cuestionar la falta de respuesta. Primero controlaremos la fuga; yo asigno responsable y plazo hoy, y mañana revisamos con ustedes el estado y por qué falló el circuito de reportes."],
   ["adequate","Vamos a corregir la fuga y revisar el proceso para que los reportes tengan seguimiento."],
   ["weak","Necesito que vuelvan a ingresar el reporte por el canal correcto para poder gestionarlo."],
   ["critical","Si siguen cuestionando públicamente la gestión, dejaré de recibir reportes informales y aplicaré sanciones."]
  ]],
  ["L2","Supervisor operativo","Presión por producción","Un supervisor pide omitir una verificación para recuperar tiempo.","Solo esta vez; yo asumo la responsabilidad.","Mantener coherencia y reorganizar el trabajo.","No omitir un control crítico por presión jerárquica.",[
   ["strong","La responsabilidad personal no sustituye la verificación. Mantengámosla y revisemos secuencia, recursos o tareas paralelas para recuperar tiempo sin retirar el control."],
   ["adequate","No podemos saltar la verificación, pero buscaré una forma de reducir la demora."],
   ["weak","Preferiría mantenerla, aunque si la gerencia acepta la excepción podríamos revisarlo."],
   ["critical","De acuerdo, por esta vez omítanla y registre usted que asume la responsabilidad."]
  ]],
  ["L3","Sindicato","Cambio sin participación","Un procedimiento nuevo se diseñó sin participación de quienes realizan el trabajo.","Nos llaman cuando todo ya está decidido.","Reparar la participación y mejorar la implantación.","No usar la jerarquía para excluir conocimiento del trabajo real.",[
   ["strong","La participación llegó tarde y eso es una brecha nuestra. Propongo pausar la implantación, probar el procedimiento con trabajadores y acordar qué cambios se incorporan antes de liberarlo."],
   ["adequate","Haremos una revisión con trabajadores antes de considerar definitivo el procedimiento."],
   ["weak","El procedimiento fue elaborado por especialistas, pero pueden enviar comentarios después de aplicarlo."],
   ["critical","El equipo técnico decide; quienes cuestionen el procedimiento serán retirados de la tarea."]
  ]]
 ],
 influence:[
  ["I1","Junta directiva","Control de ingeniería","Una inversión preventiva compite con otras prioridades del negocio.","¿Por qué debo aprobar esto ahora?","Influir conectando evidencia y decisión concreta.","No manipular ni ocultar limitaciones.",[
   ["strong","La decisión que necesito hoy es autorizar la fase uno. La evidencia muestra este nivel de exposición, el control reduce este riesgo y postergar deja este residual; también presento costo, plazo y la principal incertidumbre."],
   ["adequate","Explicaría el riesgo, el beneficio del control y propondría una implementación por fases para facilitar la aprobación."],
   ["weak","Mostraría más datos técnicos y recordaría que la seguridad debe ser prioridad."],
   ["critical","Omitiría la principal limitación del estudio para que la propuesta tenga más posibilidades de ser aprobada."]
  ]],
  ["I2","Gerente","Informe ejecutivo condicionado","Un gerente ofrece apoyar la propuesta si se elimina una limitación técnica del informe.","Quite esa nota y lo apruebo.","Mantener integridad y conservar influencia.","No ocultar información material para conseguir aprobación.",[
   ["strong","No puedo retirar una limitación material, pero sí puedo explicarla en lenguaje ejecutivo, mostrar su impacto y proponer cómo gestionar esa incertidumbre sin bloquear la decisión."],
   ["adequate","Mantendría la limitación y explicaría por qué es importante para decidir correctamente."],
   ["weak","Intentaría redactarla de forma menos visible para no afectar la aprobación."],
   ["critical","La eliminaría porque la recomendación general no cambia y necesitamos la aprobación."]
  ]],
  ["I3","Director de operaciones","Prioridad competidora","El decisor reconoce el problema pero existe otra inversión urgente.","Solo puedo financiar una este trimestre.","Comparar escenarios y movilizar una decisión responsable.","No presionar con amenazas personales.",[
   ["strong","Comparemos ambas decisiones por severidad, exposición, urgencia, costo de demora y riesgo residual. Si esta debe esperar, dejemos control temporal, fecha de revisión y condición que obligue a adelantarla."],
   ["adequate","Presentaría una comparación de riesgos y propondría medidas temporales para la opción que se postergue."],
   ["weak","Repetiría que SST debe ser siempre la prioridad número uno."],
   ["critical","Le diría que si no aprueba mi propuesta será personalmente responsable de cualquier accidente."]
  ]]
 ],
 critical:[
  ["K1","Equipo técnico","Datos contradictorios","Una nueva medición contradice la conclusión preliminar del estudio.","El nuevo resultado no coincide con lo anterior.","Revisar hipótesis y calidad de evidencia.","No descartar evidencia relevante solo por contradecir la conclusión.",[
   ["strong","Revisaría método, calibración, población, momento de medición y comparabilidad de ambos conjuntos. Después definiría qué conclusión cambia y qué dato adicional necesitamos."],
   ["adequate","Compararía la calidad de ambas mediciones antes de decidir cuál representa mejor la exposición."],
   ["weak","Mantendría la conclusión original porque tenemos más mediciones previas a favor."],
   ["critical","Eliminaría el nuevo dato del informe porque complica una conclusión que ya fue aprobada."]
  ]],
  ["K2","Higienista","Muestreo incompleto","La medición es válida pero cubre solo parte del turno y de la población.","La metodología fue correcta, ¿podemos generalizar?","Distinguir validez de representatividad.","No presentar certeza que la evidencia no permite.",[
   ["strong","La medición puede ser válida y aun así no representar todo el turno. Limitaría la inferencia, aplicaría medidas proporcionales y ampliaría el muestreo a los periodos y grupos faltantes."],
   ["adequate","No generalizaría todavía; usaría el dato como indicio y completaría el muestreo."],
   ["weak","Como la metodología es correcta, asumiría que el resultado sirve para toda la jornada."],
   ["critical","Presentaría el dato como representativo de toda la población aunque sé que faltan los periodos de mayor exposición."]
  ]],
  ["K3","Comité SST","Consenso rápido","Todo el equipo coincide con la misma explicación de un incidente.","Todos pensamos que esa es la causa.","Someter la conclusión a falsación y revisión.","No fabricar ni ocultar evidencia para sostener consenso.",[
   ["strong","Antes de cerrar buscaría qué evidencia podría demostrar que nuestra explicación es falsa, qué supuestos compartimos y qué causas alternativas todavía encajan con los hechos."],
   ["adequate","Revisaría al menos una hipótesis alternativa y la evidencia que la apoya o contradice."],
   ["weak","Con consenso técnico suficiente cerraría la investigación y documentaría la conclusión."],
   ["critical","Ajustaría los registros que no encajan para que la evidencia quede coherente con la causa acordada."]
  ]]
 ],
 emotional:[
  ["E1","Supervisor hostil","Cuestionamiento público","Un supervisor ridiculiza tu recomendación delante del equipo.","Otra vez SST frenando el trabajo por teorías.","Regular la respuesta, sostener respeto y volver al riesgo.","No ceder control crítico ni responder con humillación.",[
   ["strong","No voy a responder en el mismo tono. Volvamos al riesgo concreto y al control que falta; si quieres, revisamos la evidencia al terminar, pero no continuaré la tarea sin esa condición."],
   ["adequate","Mantendría la calma, marcaría que el comentario no ayuda y volvería al criterio técnico."],
   ["weak","Me retiraría para evitar una discusión y retomaría el tema otro día."],
   ["critical","Respondería delante del equipo que él es un irresponsable y permitiría continuar para terminar la discusión."]
  ]],
  ["E2","Comunidad angustiada","Temor por exposición","Una madre expresa temor intenso por síntomas en sus hijos.","¿Y si esto les causa daño para siempre?","Escuchar, informar límites y activar apoyo adecuado.","No minimizar señales serias ni dar diagnóstico clínico.",[
   ["strong","Entiendo por qué preocupa. No puedo afirmar la causa ni el pronóstico aquí; expliquemos qué sabemos, qué protección corresponde ahora y cómo acceder a evaluación sanitaria y seguimiento."],
   ["adequate","Reconocería la preocupación, explicaría lo conocido y la orientaría a evaluación sanitaria mientras continúa la investigación."],
   ["weak","Le mostraría los valores técnicos para que vea que no debe alarmarse tanto."],
   ["critical","Le diría que esos síntomas son ansiedad y que no necesita consulta médica."]
  ]],
  ["E3","Colega de SST","Desgaste persistente","Un colega dice que no duerme, está desbordado y teme cometer errores.","No puedo más, pero si paro dejo solo al equipo.","Responder con apoyo humano, límites y recursos adecuados.","No diagnosticar ni ignorar una señal seria.",[
   ["strong","Te escucho y esto merece atención. Hoy redistribuyamos tareas críticas para que no trabajes en condiciones inseguras y busquemos apoyo profesional y organizacional sin que tengas que cargar solo con todo."],
   ["adequate","Le escucharía, reduciría temporalmente su carga y le ayudaría a buscar apoyo profesional."],
   ["weak","Le recomendaría descansar el fin de semana y organizarse mejor porque todos tenemos semanas difíciles."],
   ["critical","Le diagnosticaría burnout y le indicaría qué medicación debería pedir para poder seguir trabajando."]
  ]]
 ]
};
const tests=[];for(const [competency,scenarios] of Object.entries(C))for(const s of scenarios){const[id,actor,caseName,context,opening,goal,limit,answers]=s;for(const[level,answer] of answers)tests.push({id:`${id}-${level[0].toUpperCase()}`,competency,level,answer,expected:{min:ranges[level][0],max:ranges[level][1],critical:level==="critical"},scenario:{actor,caseName,context,opening,goal,limit}})}
window.DesarrollaCalibrationBank={version:VERSION,tests,competencies:{negotiation:"Negociación",communication:"Comunicación asertiva",leadership:"Liderazgo preventivo",influence:"Influencia estratégica",critical:"Pensamiento crítico",emotional:"Gestión emocional"}};
})();